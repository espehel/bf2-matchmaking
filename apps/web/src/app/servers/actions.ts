'use server';
import { assertString, api, verify, getInitialServerMap } from '@bf2-matchmaking/utils';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { revalidatePath, revalidateTag } from 'next/cache';
import { wait } from '@bf2-matchmaking/utils/src/async-actions';
import { MatchesJoined } from '@bf2-matchmaking/types';
import { createServerInstance } from '@bf2-matchmaking/server';
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
