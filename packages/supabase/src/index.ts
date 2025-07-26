import {
  createClient,
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from '@supabase/supabase-js';
import { Database } from '@bf2-matchmaking/types';
import supabaseApi from './supabase-api';
import { realtime } from './realtime-api';
import { matches } from './domain/matches';
import { players } from './domain/players';
import { assertString } from '@bf2-matchmaking/utils';

export * from './error-handling';

export function getSupabaseApi(client: SupabaseClient<Database>) {
  const api = supabaseApi(client);
  return {
    ...api,
    matches: matches(client),
    players: players(client),
  };
}
export function client() {
  assertString(process.env.SUPABASE_URL, 'SUPABASE_URL not defined.');
  assertString(process.env.SUPABASE_SERVICE_KEY, 'SUPABASE_SERVICE_KEY not defined.');
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );

  return getSupabaseApi(supabase);
}

export function getSupabaseRealtimeApi(client: SupabaseClient<Database>) {
  return realtime(client);
}

export function realtimeClient() {
  assertString(process.env.SUPABASE_URL, 'SUPABASE_URL not defined.');
  assertString(process.env.SUPABASE_SERVICE_KEY, 'SUPABASE_SERVICE_KEY not defined.');
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );
  return getSupabaseRealtimeApi(supabase);
}

export const verifyResult = <T>({ data, error }: PostgrestResponse<T>) => {
  if (error) {
    throw new Error(JSON.stringify(error));
  }
  return data;
};

export const verifySingleResult = <T>({ data, error }: PostgrestSingleResponse<T>) => {
  if (error) {
    throw new Error(JSON.stringify(error));
  }
  return data;
};

export function createServiceClient() {
  assertString(process.env.SUPABASE_URL, 'SUPABASE_URL not defined.');
  assertString(process.env.SUPABASE_SERVICE_KEY, 'SUPABASE_SERVICE_KEY not defined.');
  return createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );
}

export type ResolvableSupabaseClient = SupabaseClient | (() => Promise<SupabaseClient>);
export async function resolveClient(
  client: ResolvableSupabaseClient
): Promise<SupabaseClient<Database>> {
  if (client instanceof SupabaseClient) {
    return client;
  }
  return client();
}
