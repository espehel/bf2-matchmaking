import {
  isDefined,
  MatchesJoined,
  MatchPlayersRow,
  PlayersRow,
} from '@bf2-matchmaking/types';
import PlayerItem from '@/components/matches/team/PlayerItem';

interface Props {
  match: MatchesJoined;
  team?: number;
  captains: Array<string>;
  players: Array<MatchPlayersRow>;
}

export default function PlayerListItemsLoading({
  players,
  team,
  captains,
  match,
}: Props) {
  const sortedPlayers = toPlayers();
  return (
    <>
      {sortedPlayers.map((player) => (
        <PlayerItem
          key={player.id}
          player={player}
          playerInfo={undefined}
          match={match}
          team={team}
          captains={captains}
        />
      ))}
    </>
  );
  function toPlayers(): Array<PlayersRow> {
    return players
      .map((mp) => match.players.find((p) => p.id === mp.player_id))
      .filter(isDefined)
      .sort((a, b) => a.nick.localeCompare(b.nick));
  }
}
