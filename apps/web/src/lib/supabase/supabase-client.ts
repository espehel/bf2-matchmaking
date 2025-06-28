'use client';
import { getSupabaseApi, getSupabaseRealtimeApi } from '@bf2-matchmaking/supabase';
import { createBrowserClient } from '@supabase/ssr';

export const supabaseClient = () => {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return { ...getSupabaseApi(client), auth: client.auth };
};

export function supabaseRealtime() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return getSupabaseRealtimeApi(client);
}
