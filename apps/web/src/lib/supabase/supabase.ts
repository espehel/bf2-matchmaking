'use server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { cache } from 'react';
import { getActions } from '@/lib/supabase/supabase-actions';

const createServerSupabaseClient = cache((cookies: () => ReadonlyRequestCookies) => {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
});

export const supabase = (cookies: () => ReadonlyRequestCookies) => {
  const client = createServerSupabaseClient(cookies);
  return { ...getActions(client), auth: client.auth };
};
