import {
  isNotNull,
  MatchesJoined,
  MatchResult,
  MatchResultsInsert,
  MatchResultsRow,
  PlayerListItem,
  PlayersRow,
  RoundsJoined,
} from '@bf2-matchmaking/types';

export const calculateMatchResultsOld = (
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
): Record<string, MatchResult> => ({
  ...aggregated,
  ...Object.keys(current)
    .map((key) => ({
      [key]: {
        score: current[key].score + (aggregated[key]?.score || 0),
        deaths: current[key].deaths + (aggregated[key]?.deaths || 0),
        kills: current[key].kills + (aggregated[key]?.kills || 0),
      },
    }))
    .reduce(toObject),
});

const toObject = <T = unknown>(acc: Record<string, T>, curr: Record<string, T>) => ({
  ...acc,
  ...curr,
});
export function getTeamMap(round: number): Record<string, 'a' | 'b'> {
  return round % 2 === 0 ? { '1': 'a', '2': 'b' } : { '1': 'b', '2': 'a' };
}
export function getTeamTickets(rounds: Array<RoundsJoined>, team: 'a' | 'b') {
  return rounds
    .map((round, i) =>
      getTeamMap(i)['1'] === team ? round.team1_tickets : round.team2_tickets
    )
    .reduce((acc, cur) => acc + parseInt(cur), 0);
}

export function getTeamRounds(rounds: Array<RoundsJoined>, team: 'a' | 'b') {
  return rounds
    .map((round, i) =>
      getTeamMap(i)['1'] === team
        ? parseInt(round.team1_tickets) - parseInt(round.team2_tickets)
        : parseInt(round.team2_tickets) - parseInt(round.team1_tickets)
    )
    .reduce((acc, cur) => (cur > 0 ? acc + 1 : acc), 0);
}

export function getTeamMaps(rounds: Array<RoundsJoined>, team: 'a' | 'b') {
  const otherTeam = team === 'a' ? 'b' : 'a';
  let mapsWon = 0;
  for (let i = 0; i < rounds.length; i += 2) {
    if (i + 2 > rounds.length) {
      break;
    }
    const tickets =
      getTeamTickets(rounds.slice(i, i + 2), team) -
      getTeamTickets(rounds.slice(i, i + 2), otherTeam);
    if (tickets > 0) {
      mapsWon++;
    }
  }
  return mapsWon;
}

export function calculateMatchResults(
  match: MatchesJoined
): [MatchResultsInsert, MatchResultsInsert] {
  const mapsA = getTeamMaps(match.rounds, 'a');
  const mapsB = getTeamMaps(match.rounds, 'b');
  const roundsA = getTeamRounds(match.rounds, 'a');
  const roundsB = getTeamRounds(match.rounds, 'b');
  const ticketsA = getTeamTickets(match.rounds, 'a');
  const ticketsB = getTeamTickets(match.rounds, 'b');
  const scoreA = mapsA * 100 + roundsA * 10 + ticketsA;
  const scoreB = mapsB * 100 + roundsB * 10 + ticketsB;
  return [
    {
      id: match.id,
      team: 'a',
      maps: mapsA,
      rounds: roundsA,
      tickets: ticketsA,
      is_winner: scoreA > scoreB,
    },
    {
      id: match.id,
      team: 'b',
      maps: mapsA,
      rounds: roundsA,
      tickets: ticketsA,
      is_winner: scoreB > scoreA,
    },
  ];
}

export function calculatePlayerResults(match: MatchesJoined) {}
