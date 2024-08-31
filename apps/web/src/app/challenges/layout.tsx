import { ReactNode } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import AuthButton from '@/components/AuthButton';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: player } = await supabase(cookies).getSessionPlayer();
  return (
    <main className="main">
      <h1 className="mb-6">Challenges</h1>
      {player && children}
      {!player && (
        <section className="section w-fit">
          <h2>You are not logged in</h2>
          <AuthButton className="btn btn-accent w-20" session={null} />
        </section>
      )}
    </main>
  );
}
