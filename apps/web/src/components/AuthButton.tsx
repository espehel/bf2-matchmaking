'use client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabase/supabase-client';

interface Props {
  user: User | null;
  className?: string;
}
export default function AuthButton({ user, className }: Props) {
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (user) {
    return (
      <button className={className} onClick={handleSignOut}>
        Sign out
      </button>
    );
  }

  return (
    <button className={className} onClick={handleSignIn}>
      Sign in
    </button>
  );
}
