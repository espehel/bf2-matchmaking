import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase/supabase-server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectedFrom = requestUrl.searchParams.get('redirectedFrom');
  const cookieStore = await cookies();

  if (code) {
    await supabase(cookieStore).auth.exchangeCodeForSession(code);
  }
  // URL to redirect to after sign in process completes
  return NextResponse.redirect(redirectedFrom || requestUrl.origin);
}
