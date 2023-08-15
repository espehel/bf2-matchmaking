import {
  isNotNull,
  MatchesJoined,
  MatchResult,
  PlayerListItem,
  PlayersRow,
  RoundsJoined,
} from '@bf2-matchmaking/types';

export const calculateMatchResults = (
  match: MatchesJoined
): Array<[PlayersRow, MatchResult | null]> => {
  const results = match.rounds
    .map(getRoundResults)
    .filter(isNotNull)
    .reduce(aggregateRound, {});
  return match.players.map((player) => [
    player,
    (player.keyhash && results[player.keyhash]) || null,
  ]);
};

const getRoundResults = (round: RoundsJoined): Record<string, MatchResult> | null => {
  const playerList: Array<PlayerListItem> =
    typeof round.pl === 'string' ? JSON.parse(round.pl) : null;

  if (playerList) {
    return playerList
      .map(({ keyhash, score, deaths, scoreKills }) => ({
        [keyhash]: {
          score: parseInt(score),
          deaths: parseInt(deaths),
          kills: parseInt(scoreKills),
        },
      }))
      .reduce(toObject, {});
  }
  return null;
};

const aggregateRound = (
  aggregated: Record<string, MatchResult>,
  current: Record<string, MatchResult>
): Record<string, MatchResult> =>
  Object.keys(current)
    .map((key) => ({
      [key]: {
        score: current[key].score + (aggregated[key]?.score || 0),
        deaths: current[key].deaths + (aggregated[key]?.deaths || 0),
        kills: current[key].kills + (aggregated[key]?.kills || 0),
      },
    }))
    .reduce(toObject);

const toObject = <T = unknown>(acc: Record<string, T>, curr: Record<string, T>) => ({
  ...acc,
  ...curr,
});
export function getTeamMap(round: number): Record<string, 'a' | 'b'> {
  return round % 2 === 0 ? { '1': 'a', '2': 'b' } : { '1': 'b', '2': 'a' };
}
export function getTeamTickets(match: MatchesJoined, team: 'a' | 'b') {
  return match.rounds
    .map((round, i) =>
      getTeamMap(i)['1'] === team ? round.team1_tickets : round.team2_tickets
    )
    .reduce((acc, cur) => acc + parseInt(cur), 0);
}

export function getTeamRounds(match: MatchesJoined, team: 'a' | 'b') {
  return match.rounds
    .map((round, i) =>
      getTeamMap(i)['1'] === team
        ? parseInt(round.team1_tickets) - parseInt(round.team2_tickets)
        : parseInt(round.team2_tickets) - parseInt(round.team1_tickets)
    )
    .reduce((acc, cur) => (cur > 0 ? acc + 1 : acc), 0);
}
