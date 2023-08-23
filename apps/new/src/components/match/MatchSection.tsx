import { MatchesJoined, MatchPlayersRow, PlayerListItem } from '@bf2-matchmaking/types';
import MatchActions from '@/components/match/MatchActions';
import { api } from '@bf2-matchmaking/utils';
import PlayerItem from '@/components/match/PlayerItem';
import { client } from '@bf2-matchmaking/supabase';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

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
      {isMatchAdmin && <MatchActions match={match} servers={servers} />}
    </section>
  );
}
