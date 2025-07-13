import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { getActions } from '@/lib/supabase/supabase-actions';
import { createServerClient } from '@supabase/ssr';
import { matchDrafts as md, matches as m } from '@bf2-matchmaking/supabase/matches';
import { configs as c } from '@bf2-matchmaking/supabase/configs';
import { players as p } from '@bf2-matchmaking/supabase/players';
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
export const matchDrafts = md(createClient);
export const players = p(createClient);
