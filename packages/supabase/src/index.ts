import {
  createClient,
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from '@supabase/supabase-js';
import invariant from 'tiny-invariant';
import { createServerClient } from '@supabase/auth-helpers-remix';
import matchServices from './services/match-service';
import { Database } from '@bf2-matchmaking/types';
import supabaseApi from './supabase-api';

export const getSupabaseApi = (client: SupabaseClient<Database>) => {
  const api = supabaseApi(client);
  const services = matchServices(api);
  return { ...api, services };
};
export const client = () => {
  invariant(process.env.SUPABASE_URL, 'SUPABASE_URL not defined.');
  invariant(process.env.SUPABASE_SERVICE_KEY, 'SUPABASE_SERVICE_KEY not defined.');
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );

  return getSupabaseApi(supabase);
};

export const remixClient = (request: Request) => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  invariant(SUPABASE_URL, 'SUPABASE_URL not defined.');
  invariant(SUPABASE_ANON_KEY, 'SUPABASE_ANON_KEY not defined.');
  const response = new Response();
  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    request,
    response,
  });

  const api = supabaseApi(supabase);
  const services = matchServices(api);

  return {
    ...api,
    services,
    response,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    getSession: () => supabase.auth.getSession(),
    getUser: () => supabase.auth.getUser().then(({ data }) => data.user),
    signInUser: (redirectTo: string) =>
      supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo,
        },
      }),
  };
};

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
