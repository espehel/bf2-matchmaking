'use server';
import {
  assertString,
  api,
  verify,
  createServerName,
  getInitialServerMap,
  getServerVehicles,
} from '@bf2-matchmaking/utils';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { revalidatePath, revalidateTag } from 'next/cache';
import { wait } from '@bf2-matchmaking/utils/src/async-actions';
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
  const { matchId, vehicles, nameInput, domainInput, mapInput, regionInput } =
    Object.fromEntries(data);
  assertString(matchId);
  assertString(vehicles);
  assertString(nameInput);
  assertString(domainInput);
  assertString(regionInput);
  assertString(mapInput);

  const map = getInitialServerMap(mapInput);

  const { data: server } = await supabase(cookies).getServerByName(nameInput);

  if (server) {
    return { data: null, error: { message: 'Server already exists', code: 409 } };
  }

  const result = await api
    .platform()
    .postServers(nameInput, regionInput, matchId, map, vehicles, domainInput);

  if (result.error) {
    logErrorMessage(`Server ${nameInput}: Generation failed`, result.error);
    return result;
  }

  logMessage(`Server ${nameInput}: Generation started`, {
    nameInput,
    regionInput,
    matchId,
    map,
    vehicles,
    domainInput,
  });

  await wait(2);
  revalidateTag('platformGetServers');
  revalidatePath(`matches/${matchId}/server`);

  return result;
}
