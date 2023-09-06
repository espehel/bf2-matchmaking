'use server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { getSupabaseApi } from '@bf2-matchmaking/supabase';
export const supabase = (cookies: () => ReadonlyRequestCookies) => {
  const client = createServerComponentClient({ cookies });
  const api = getSupabaseApi(client);
  async function getSessionPlayer() {
    const { data, error } = await client.auth.getSession();
    if (error) {
      return { data: null, error };
    }
    if (!data.session) {
      return { data: null, error: { message: 'Not logged in' } };
    }
    return api.getPlayerByUserId(data.session.user.id);
  }
  async function getAdminRoles() {
    const { data, error } = await client.auth.getSession();
    if (data.session) {
      return api.getAdminRoles(data.session.user.id);
    }
    return { data: null, error };
  }

  return { ...api, auth: client.auth, getSessionPlayer, getAdminRoles };
};
