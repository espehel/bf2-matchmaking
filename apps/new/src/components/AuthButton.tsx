'use client';
import { Database } from '@bf2-matchmaking/types';
import { createClientComponentClient, Session } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface Props {
  session: Session | null;
  className?: string;
}
export default function AuthButton({ session, className }: Props) {
  const supabase = createClientComponentClient<Database>();
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

  if (session) {
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
