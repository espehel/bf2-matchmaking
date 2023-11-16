'use server';
import { assertString, api, verify } from '@bf2-matchmaking/utils';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
export async function createServer(data: FormData) {
  const { addressInput, portInput, rconPortInput, rconPwInput } =
    Object.fromEntries(data);
  assertString(addressInput);
  assertString(portInput);
  assertString(rconPortInput);
  assertString(rconPwInput);

  const { data: serverInfo, error } = await api.rcon().postRconServerInfo({
    host: addressInput,
    password: rconPwInput,
    port: rconPortInput,
    persist: true,
  });

  if (error) {
    return { error: 'Server connection failed.', data: null };
  }

  const { data: server, error: serverError } = await supabase(cookies).createServer({
    ip: addressInput,
    name: serverInfo.serverName,
    port: portInput,
  });

  if (serverError) {
    return { error: 'Failed to create server.', data: null };
  }

  await supabase(cookies)
    .createServerRcon({
      id: server.ip,
      rcon_pw: rconPwInput,
      rcon_port: parseInt(rconPortInput),
    })
    .then(verify);

  redirect(`/servers/${server.ip}`);
  return { data: server, error: null };
}

export async function generateServer(data: FormData) {
  const { nameInput, regionInput, configInput, tagInput } = Object.fromEntries(data);
  assertString(nameInput);
  assertString(regionInput);
  assertString(configInput);
  assertString(tagInput);

  const config = await supabase(cookies).getMatchConfig(Number(configInput));
  if (config.error) {
    console.error(config.error);
    return config;
  }

  const result = await api
    .platform()
    .postServers(nameInput, regionInput, config.data.name, `Match ${tagInput}`);

  if (result.error) {
    logErrorMessage(`Server ${nameInput}: Generation failed`, result.error);
    return result;
  }

  logMessage(`Server ${nameInput}: Generation started`, { regionInput, configInput });
  return result;
}
