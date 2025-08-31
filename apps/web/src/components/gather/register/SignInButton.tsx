'use client';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/supabase-client';

export default function SignInButton() {
  const supabase = supabaseClient();
  const router = useRouter();
  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${location.origin}/auth/callback?redirectedFrom=${location.href}`,
      },
    });
    router.refresh();
  };

  return (
    <button className="btn btn-primary btn-lg" onClick={handleSignIn}>
      Sign in with Discord
    </button>
  );
}
