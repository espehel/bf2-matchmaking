'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getSupabaseApi, getSupabaseRealtimeApi } from '@bf2-matchmaking/supabase';
interface LoaderParams {
  src: string;
  width: number;
  quality?: number;
}
export const supabaseImageLoader = ({ src, width, quality }: LoaderParams) => {
  return `${
    process.env.NEXT_PUBLIC_SUPABASE_URL
  }/storage/v1/object/public/${src}?width=${width}&quality=${quality || 75}`;
};

export const supabaseClient = () => {
  const client = createClientComponentClient();
  return getSupabaseApi(client);
};

export function supabaseRealtime() {
  const client = createClientComponentClient();
  return getSupabaseRealtimeApi(client);
}
