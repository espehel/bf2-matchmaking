import Link from 'next/link';
import AuthButton from '@/components/AuthButton';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export default async function Header() {
  const { data: session } = await supabase(cookies).auth.getSession();
  return (
    <header className="navbar bg-primary text-primary-content">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost normal-case text-xl">
          BF2 Matchmaking
        </Link>
      </div>
      <div className="navbar-end">
        <AuthButton className="btn" session={session.session} />
      </div>
    </header>
  );
}
