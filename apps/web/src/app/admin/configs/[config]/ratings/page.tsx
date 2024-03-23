import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import ManageRatingsSection from '@/components/admin/ManageRatingsSection';
import { verifySingleResult } from '@bf2-matchmaking/supabase';

interface Props {
  params: { config: string };
}
export default async function Page({ params }: Props) {
  const config = await supabase(cookies)
    .getMatchConfig(Number(params.config))
    .then(verifySingleResult);
  const { data: ratings } = await supabase(cookies).getRatingsByConfig(
    Number(params.config)
  );
  const { data: players } = await supabase(cookies).getPlayers();

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
