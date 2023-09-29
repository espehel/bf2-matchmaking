import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import MatchSection from '@/components/match/MatchSection';
import ServerSection from '@/components/match/ServerSection';
import LiveSection from '@/components/match/LiveSection';
import RoundsList from '@/components/RoundsList';
import moment from 'moment/moment';

interface Props {
  params: { match: string };
}
export default async function ResultsMatch({ params }: Props) {
  const match = await supabase(cookies)
    .getMatch(parseInt(params.match))
    .then(verifySingleResult);

  const { data: adminRoles } = await supabase(cookies).getAdminRoles();
  const { data: sessionPlayer } = await supabase(cookies).getSessionPlayer();

  const isMatchPlayer = match.players.some((p) => p.id === sessionPlayer?.id);

  return (
    <main className="main flex flex-col items-center text-center">
      <div className="mb-8">
        <h1 className="text-accent font-bold">{`Match ${match.id}`}</h1>
        <p className="text-sm text-gray font-bold">
          {moment(match.created_at).format('HH:mm - dddd Do MMMM')}
        </p>
      </div>
      <div className="flex flex-wrap gap-8 justify-center w-full">
        <MatchSection match={match} isMatchAdmin={Boolean(adminRoles?.match_admin)} />
        <ServerSection
          match={match}
          isMatchAdmin={Boolean(adminRoles?.match_admin)}
          isMatchPlayer={isMatchPlayer}
        />
        <LiveSection match={match} isMatchAdmin={Boolean(adminRoles?.match_admin)} />
        <div className="divider" />
        <RoundsList
          rounds={[...match.rounds].sort((a, b) =>
            a.created_at.localeCompare(b.created_at)
          )}
        />
      </div>
    </main>
  );
}
