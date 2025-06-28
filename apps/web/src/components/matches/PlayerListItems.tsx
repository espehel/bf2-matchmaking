import {
  isDefined,
  MatchesJoined,
  MatchPlayersRow,
  MatchStatus,
  PlayerListItem,
  PlayersRow,
} from '@bf2-matchmaking/types';
import PlayerItem from '@/components/matches/PlayerItem';
import { api } from '@bf2-matchmaking/utils';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';

interface Props {
  match: MatchesJoined;
  team?: number;
  captains: Array<string>;
  players: Array<MatchPlayersRow>;
}

export default async function PlayerListItems({ players, team, captains, match }: Props) {
  const playersTuple = await fetchPlayerInfo().then(toPlayerTuple);
  return (
    <>
      {playersTuple.map(([player, playerInfo]) => (
        <PlayerItem
          key={player.id}
          player={player}
          playerInfo={playerInfo}
          match={match}
          team={team}
          captains={captains}
        />
      ))}
    </>
  );
  async function fetchPlayerInfo(): Promise<Array<PlayerListItem>> {
    const cookieStore = await cookies();
    const { data: matchServer } = await supabase(cookieStore).getMatchServers(match.id);
    //TODO: handle multiple match servers
    const server = matchServer?.servers?.at(0);
    if (server && match.status === MatchStatus.Ongoing) {
      const { data } = await api.live().getServerPlayerList(server.ip);
      if (data) {
        return data;
      }
    }
    return [];
  }
  function toPlayerTuple(
    infoList: Array<PlayerListItem>
  ): Array<[PlayersRow, PlayerListItem | undefined]> {
    return players
      .map((mp) => match.players.find((p) => p.id === mp.player_id))
      .filter(isDefined)
      .map<[PlayersRow, PlayerListItem | undefined]>((p) => [
        p,
        infoList.find((bf2p) => bf2p.keyhash === p.keyhash),
      ])
      .sort(([aP, aI], [bP, bI]) => {
        if (!aI && !bI) {
          return aP.nick.localeCompare(bP.nick);
        }
        return (
          (aI ? Number(aI.index) : Number.MAX_VALUE) -
          (bI ? Number(bI.index) : Number.MAX_VALUE)
        );
      });
  }
}
