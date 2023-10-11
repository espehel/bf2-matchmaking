import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';
import { Database } from '@bf2-matchmaking/types';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectedFrom = requestUrl.searchParams.get('redirectedFrom');

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }
  // URL to redirect to after sign in process completes
  return NextResponse.redirect(redirectedFrom || requestUrl.origin);
}
