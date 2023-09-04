import {
  MatchesJoined,
  MatchPlayersRow,
  MatchStatus,
  PlayerListItem,
} from '@bf2-matchmaking/types';
import MatchActions from '@/components/match/MatchActions';
import { api } from '@bf2-matchmaking/utils';
import PlayerItem from '@/components/match/PlayerItem';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import Link from 'next/link';

interface Props {
  match: MatchesJoined;
  isMatchAdmin: boolean;
}

export default async function MatchSection({ match, isMatchAdmin }: Props) {
  let playerInfo: PlayerListItem[] = [];
  if (match.server) {
    const { data } = await api.rcon().getServerPlayerList(match.server?.ip);
    if (data) {
      playerInfo = data;
    }
  }

  const { data: servers } = await supabase(cookies).getServers();

  const isTeam = (team: string) => (mp: MatchPlayersRow) => mp.team === team;

  return (
    <section className="section w-fit">
      <h2 className="text-xl">{`${match.config.size / 2}v${match.config.size / 2} - ${
        match.status
      }`}</h2>
      <div className="flex justify-center gap-8">
        <div>
          <div className="text-xl font-bold mb-2">Team A</div>
          <ul>
            {match.teams.filter(isTeam('a')).map((mp) => (
              <PlayerItem
                key={mp.player_id}
                match={match}
                playerList={playerInfo}
                mp={mp}
                team="a"
              />
            ))}
          </ul>
        </div>
        <div className="divider divider-horizontal">vs</div>
        <div>
          <div className="text-xl font-bold mb-2">Team B</div>
          <ul>
            {match.teams.filter(isTeam('b')).map((mp) => (
              <PlayerItem
                key={mp.player_id}
                match={match}
                playerList={playerInfo}
                mp={mp}
                team="b"
              />
            ))}
          </ul>
        </div>
      </div>
      {match.status === MatchStatus.Closed && (
        <Link
          className="btn btn-primary btn-lg btn-wide m-auto"
          href={`/results/${match.id}`}
        >
          Go to results
        </Link>
      )}
      {isMatchAdmin && match.status !== MatchStatus.Closed && (
        <div>
          <div className="divider mt-0" />
          <MatchActions match={match} servers={servers} />
        </div>
      )}
    </section>
  );
}
