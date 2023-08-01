'use server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { getSupabaseApi } from '@bf2-matchmaking/supabase';
export const supabase = (cookies: () => ReadonlyRequestCookies) => {
  const client = createServerComponentClient({ cookies });
  const api = getSupabaseApi(client);
  async function getSessionPlayer() {
    const { data, error } = await client.auth.getSession();
    if (data.session) {
      return api.getPlayerByUserId(data.session.user.id);
    }
    return { data: null, error };
  }

  return { ...api, auth: client.auth, getSessionPlayer };
};
