import {
  isNotNull,
  LiveInfo,
  MatchesJoined,
  PlayerListItem,
  RoundsJoined,
  RoundsRow,
} from '@bf2-matchmaking/types';
import { parseJSON } from './json-utils';
import { getMatchPlayer } from './player-utils';

export function toKeyhashList(round: RoundsRow | RoundsJoined) {
  try {
    const info = parseJSON<LiveInfo>(round.info);
    return info.players.map(({ keyhash }) => keyhash);
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function getTeamTuple(playerList: Array<PlayerListItem>, match: MatchesJoined) {
  return playerList
    .filter((p) => p.getTeam === '1')
    .map(getMatchPlayer(match))
    .reduce((acc, cur) => (cur?.team === match.home_team.id ? acc + 1 : acc - 1), 0) > 0
    ? [match.home_team.id, match.away_team.id]
    : [match.away_team.id, match.home_team.id];
}

export function mapToKeyhashes(rounds: Array<RoundsJoined | RoundsRow>) {
  return rounds.map(toKeyhashList).filter(isNotNull).flat();
}
