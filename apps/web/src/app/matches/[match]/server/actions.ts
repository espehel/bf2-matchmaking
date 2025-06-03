import {
  CreateServerOptions,
  GeneratedServersInsert,
  GeneratedServersRow,
  MatchesJoined,
} from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createServerInstance, generateServers } from '@bf2-matchmaking/server';
import { wait } from '@bf2-matchmaking/utils';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';

export async function addGeneratedServer(values: GeneratedServersInsert) {
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).createGeneratedServer(values);

  if (result.data) {
    revalidatePath(`/matches/${result.data.match_id}/server`);
  }

  return result;
}

export async function generateMatchServers(
  match: MatchesJoined,
  generatedServers: Array<GeneratedServersRow> | null
) {
  if (generatedServers && generatedServers.length > 0) {
    const regions = generatedServers.map(({ region }) => region);
    const result = await generateServers(match, regions);

    if (result.instances.length) {
      revalidatePath(`/matches/${match.id}`);
      return { data: result.instances, error: null };
    } else {
      return { data: null, error: { message: `["${result.errors.join('", "')}"]` } };
    }
  }
  return { data: null, error: { message: 'Invalid match for generating server' } };
}

export async function generateMatchServer(
  match: MatchesJoined,
  options: CreateServerOptions
) {
  const name = options.name;
  const cookieStore = await cookies();
  const { data: server } = await supabase(cookieStore).getServerByName(name);

  if (server) {
    return { data: null, error: { message: 'Server already exists', code: 409 } };
  }

  const result = await createServerInstance(match, options);

  if (result.error) {
    logErrorMessage(`Server ${name}: Generation failed`, result.error, {
      match,
      options,
    });
    return result;
  }

  logMessage(`Server ${name}: Generation started`, {
    match,
    options,
  });

  await wait(2);
  revalidateTag('platformGetServers');
  revalidatePath(`matches/${match.id}/server`);

  return result;
}
