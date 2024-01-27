import { MatchesJoined, MatchServer, MatchServersInsert } from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createServerInstance, generateServers } from '@bf2-matchmaking/server';
import { assertString, getInitialServerMap } from '@bf2-matchmaking/utils';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { wait } from '@bf2-matchmaking/utils/src/async-actions';

export async function updateMatchServer(values: MatchServersInsert) {
  const result = await supabase(cookies).upsertMatchServer(values);

  if (result.data) {
    revalidatePath(`/matches/${result.data.id}/server`);
  }

  return result;
}

export async function generateMatchServers(
  match: MatchesJoined,
  matchServer: MatchServer
) {
  if (matchServer.locations.length > 0) {
    const result = await generateServers(match, matchServer.locations);

    if (result.instances.length) {
      revalidatePath(`/matches/${match.id}`);
      return { data: result.instances, error: null };
    } else {
      return { data: null, error: { message: `["${result.errors.join('", "')}"]` } };
    }
  }
  return { data: null, error: { message: 'Invalid match for generating server' } };
}

export async function generateMatchServer(match: MatchesJoined, data: FormData) {
  const { nameInput, domainInput, mapInput, regionInput } = Object.fromEntries(data);
  assertString(nameInput);
  assertString(domainInput);
  assertString(regionInput);
  assertString(mapInput);

  const map = getInitialServerMap(mapInput);

  const { data: server } = await supabase(cookies).getServerByName(nameInput);

  if (server) {
    return { data: null, error: { message: 'Server already exists', code: 409 } };
  }

  const result = await createServerInstance(match, {
    name: nameInput,
    region: regionInput,
    map: mapInput,
    subDomain: domainInput,
  });

  if (result.error) {
    logErrorMessage(`Server ${nameInput}: Generation failed`, result.error);
    return result;
  }

  logMessage(`Server ${nameInput}: Generation started`, {
    match,
    nameInput,
    regionInput,
    map,
    domainInput,
  });

  await wait(2);
  revalidateTag('platformGetServers');
  revalidatePath(`matches/${match.id}/server`);

  return result;
}
