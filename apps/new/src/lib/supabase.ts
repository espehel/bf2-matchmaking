'use server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { getSupabaseApi } from '@bf2-matchmaking/supabase';
export const supabase = (cookies: () => ReadonlyRequestCookies) => {
  const client = createServerComponentClient({ cookies });
  return { ...getSupabaseApi(client), auth: client.auth };
};
