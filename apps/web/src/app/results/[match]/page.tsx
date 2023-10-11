import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import RoundsList from '@/components/RoundsList';
import MatchResultSection from '@/components/result/MatchResultSection';
import { MatchStatus } from '@bf2-matchmaking/types';
import MatchFinishedSection from '@/components/result/MatchFinishedSection';
import Link from 'next/link';
import moment from 'moment/moment';

interface Props {
  params: { match: string };
}
export default async function ResultsMatch({ params }: Props) {
  const match = await supabase(cookies)
    .getMatch(Number(params.match))
    .then(verifySingleResult);

  const isFinished = match.status === MatchStatus.Finished;
  const isClosed = match.status === MatchStatus.Closed;
  const isOngoing = match.status === MatchStatus.Ongoing;

  return (
    <main className="main text-center">
      <div className="mb-8">
        <h1 className="text-accent font-bold">{`Match ${match.id}`}</h1>
        <p className="text-sm text-gray font-bold">
          {moment(match.closed_at || match.created_at).format('HH:mm - dddd Do MMMM')}
        </p>
      </div>
      {isFinished && <MatchFinishedSection match={match} />}
      {isClosed && <MatchResultSection match={match} />}
      {isOngoing && (
        <Link className="link" href={`/matches/${match.id}`}>
          Match is still ongoing
        </Link>
      )}
      {match.rounds.length > 0 && <div className="divider" />}
      <RoundsList
        rounds={[...match.rounds].sort((a, b) =>
          a.created_at.localeCompare(b.created_at)
        )}
      />
    </main>
  );
}
