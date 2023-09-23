import { MatchesJoined, MatchStatus, PlayerListItem } from '@bf2-matchmaking/types';
import MatchActions from '@/components/match/MatchActions';
import { api } from '@bf2-matchmaking/utils';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import Link from 'next/link';
import TeamSection from '@/components/match/TeamSection';

interface Props {
  match: MatchesJoined;
  isMatchAdmin: boolean;
}

export default async function MatchSection({ match, isMatchAdmin }: Props) {
  let playerInfo: PlayerListItem[] = [];
  if (match.server) {
    const { data } = await api.rcon().getServerPlayerList(match.server.ip);
    if (data) {
      playerInfo = data;
    }
  }

  const { data: servers } = await supabase(cookies).getServers();

  return (
    <section className="section w-fit">
      <div>
        <h2 className="text-xl">{`${match.config.size / 2}v${match.config.size / 2} - ${
          match.status
        }`}</h2>
        <p className="text-sm text-gray font-bold">
          {`Rounds played: ${match.rounds.length}`}
        </p>
      </div>
      <div className="flex justify-center gap-8">
        <TeamSection match={match} team={match.home_team} playerInfo={playerInfo} />
        <div className="divider divider-horizontal">vs</div>
        <TeamSection match={match} team={match.away_team} playerInfo={playerInfo} />
      </div>
      {match.status === MatchStatus.Closed && (
        <Link className="btn btn-primary btn-lg btn-wide" href={`/results/${match.id}`}>
          Go to results
        </Link>
      )}
      {isMatchAdmin && (
        <div>
          <div className="divider mt-0" />
          <MatchActions match={match} servers={servers} />
        </div>
      )}
    </section>
  );
}
