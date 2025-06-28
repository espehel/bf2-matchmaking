import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import ManageRatingsSection from '@/components/admin/ManageRatingsSection';
import { verifySingleResult } from '@bf2-matchmaking/supabase';

interface Props {
  params: Promise<{ config: string }>;
}
export default async function Page(props: Props) {
  const params = await props.params;
  const cookieStore = await cookies();
  const config = await supabase(cookieStore)
    .getMatchConfig(Number(params.config))
    .then(verifySingleResult);
  const { data: ratings } = await supabase(cookieStore).getRatingsByConfig(
    Number(params.config)
  );
  const { data: players } = await supabase(cookieStore).getPlayers();

  return (
    <main className="main">
      <h1>{`${config.name} ratings`}</h1>
      <ManageRatingsSection
        players={players || []}
        ratings={ratings || []}
        config={config}
      />
    </main>
  );
}
