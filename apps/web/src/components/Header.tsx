import Link from 'next/link';
import AuthButton from '@/components/AuthButton';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

export default async function Header() {
  const { data: session } = await supabase(cookies).auth.getSession();
  const { data: player } = await supabase(cookies).getSessionPlayer();
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();
  return (
    <header className="navbar bg-primary text-primary-content h-header">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost normal-case text-xl">
          BF2 Matchmaking
        </Link>
      </div>
      <div className="navbar-end gap-4">
        <Link href="/challenges">Challenges</Link>
        <Link href="/matches">Matches</Link>
        <Link href="/results">Results</Link>
        <Link href="/teams">Teams</Link>
        <Link href="/servers">Servers</Link>
        {adminRoles?.system_admin && <Link href="/admin">Admin</Link>}
        {player && <Link href={`/players/${player.id}`}>{player.nick}</Link>}
        <AuthButton className="btn btn-accent" session={session.session} />
      </div>
    </header>
  );
}
