import React from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {
  children: React.ReactNode;
}

export default async function Layout({ children }: Props) {
  const cookieStore = await cookies();
  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();

  if (!adminRoles?.player_admin) {
    return (
      <main>
        <h1>Unauthorized</h1>
        <p>Only admins can access this page</p>
      </main>
    );
  }
  return <>{children}</>;
}
