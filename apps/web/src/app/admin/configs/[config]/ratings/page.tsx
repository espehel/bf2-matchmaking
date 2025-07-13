import { players, supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import ManageRatingsSection from '@/components/admin/ManageRatingsSection';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import Link from 'next/link';

interface Props {
  params: Promise<{ config: string }>;
  searchParams: Promise<{ match?: string }>;
}
export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const config = await supabase(cookieStore)
    .getMatchConfig(Number(params.config))
    .then(verifySingleResult);
  const { data: ratings } = await supabase(cookieStore).getRatingsByConfig(
    Number(params.config)
  );
  const { data } = searchParams.match
    ? await players.getByMatchId(searchParams.match)
    : await players.getAll();

  return (
    <main className="main">
      <h1>{`${config.name} ratings`}</h1>
      {searchParams.match && (
        <p>
          Filtering players by match: {searchParams.match}.{' '}
          <Link href={`/admin/configs/${params.config}/ratings`}>
            Click to remove filter
          </Link>
        </p>
      )}
      <ManageRatingsSection
        players={data || []}
        ratings={ratings || []}
        config={config}
      />
    </main>
  );
}
