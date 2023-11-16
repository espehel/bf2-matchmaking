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
  const { matchInput, regionInput } = Object.fromEntries(data);
  assertString(matchInput);
  assertString(regionInput);

  const matchResult = await supabase(cookies).getMatch(Number(matchInput));
  if (matchResult.error) {
    console.error(matchResult.error);
    return matchResult;
  }
  const { id, config } = matchResult.data;
  const name = `${config.name} Match ${id}`;

  const result = await api
    .platform()
    .postServers(name, regionInput, config.name, `Match ${id}`);

  if (result.error) {
    logErrorMessage(`Server ${name}: Generation failed`, result.error);
    return result;
  }

  logMessage(`Server ${name}: Generation started`, {
    regionInput,
    matchInput,
    config,
    id,
  });
  return result;
}
