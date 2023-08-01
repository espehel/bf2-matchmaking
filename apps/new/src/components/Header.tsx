import Link from 'next/link';
import AuthButton from '@/components/AuthButton';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export default async function Header() {
  const { data: session } = await supabase(cookies).auth.getSession();
  const { data: player } = await supabase(cookies).getSessionPlayer();
  return (
    <header className="navbar bg-primary text-primary-content">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost normal-case text-xl">
          BF2 Matchmaking
        </Link>
      </div>
      <div className="navbar-end">
        {player && <div className="p-2">{player.full_name}</div>}
        <AuthButton className="btn" session={session.session} />
      </div>
    </header>
  );
}
