import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { getActions } from '@/lib/supabase/supabase-actions';
import { createServerClient } from '@supabase/ssr';
import { matches as m } from '@bf2-matchmaking/supabase/matches';
import { configs as c } from '@bf2-matchmaking/supabase/configs';
import { players as p } from '@bf2-matchmaking/supabase/players';
import { session as s } from '@bf2-matchmaking/supabase/session';
import { events as e } from '@bf2-matchmaking/supabase/events';
import { results as r } from '@bf2-matchmaking/supabase/results';
import { teams as t } from '@bf2-matchmaking/supabase/teams';
import { cookies } from 'next/headers';

export function createServerSupabaseClient(cookieStore: ReadonlyRequestCookies) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export const supabase = (cookieStore: ReadonlyRequestCookies) => {
  const client = createServerSupabaseClient(cookieStore);
  return { ...getActions(client), auth: client.auth };
};

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export const configs = c(createClient);
export const matches = m(createClient);
export const players = p(createClient);
export const session = s(createClient);
export const events = e(createClient);
export const results = r(createClient);
export const teams = t(createClient);
