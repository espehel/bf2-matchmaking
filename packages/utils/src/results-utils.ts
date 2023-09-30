import {
  isNotNull,
  MatchesJoined,
  RoundStats,
  MatchResultsInsert,
  PlayerListItem,
  PlayersRow,
  RoundsJoined,
  MatchPlayerResultsInsert,
  PlayersInsert,
} from '@bf2-matchmaking/types';
import { parseJSON } from './json-utils';

export const calculateMatchResultsOld = (
  match: MatchesJoined
): Array<[PlayersRow, RoundStats | null]> => {
  const results = match.rounds
    .map(getPlayerRoundStats)
    .filter(isNotNull)
    .reduce(aggregateRound, {});

  return match.players.map((player) => [
    player,
    (player.keyhash && results[player.keyhash]) || null,
  ]);
};

export const getPlayerRoundStats = (
  round: RoundsJoined
): Record<string, RoundStats> | null => {
  try {
    const playerList = parseJSON<Array<PlayerListItem>>(round.pl);
    return playerList
      .map(({ keyhash, score, deaths, scoreKills }) => ({
        [keyhash]: {
          score: parseInt(score),
          deaths: parseInt(deaths),
          kills: parseInt(scoreKills),
        },
      }))
      .reduce(toObject, {});
  } catch (e) {
    console.error(e);
    return null;
  }
};

const aggregateRound = (
  aggregated: Record<string, RoundStats>,
  current: Record<string, RoundStats>
): Record<string, RoundStats> => ({
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
export function getTeamMap(round: number): Record<string, number> {
  return round % 2 === 0 ? { '1': 1, '2': 2 } : { '1': 1, '2': 2 };
}
export function getTeamTickets(rounds: Array<RoundsJoined>, team: number) {
  return rounds
    .map((round, i) =>
      getTeamMap(i)['1'] === team ? round.team1_tickets : round.team2_tickets
    )
    .reduce((acc, cur) => acc + parseInt(cur), 0);
}

export function getTeamRounds(rounds: Array<RoundsJoined>, team: number) {
  return rounds
    .map((round, i) =>
      getTeamMap(i)['1'] === team
        ? parseInt(round.team1_tickets) - parseInt(round.team2_tickets)
        : parseInt(round.team2_tickets) - parseInt(round.team1_tickets)
    )
    .reduce((acc, cur) => (cur > 0 ? acc + 1 : acc), 0);
}

export function getTeamMaps(rounds: Array<RoundsJoined>, team: 1 | 2) {
  const otherTeam = team === 1 ? 2 : 1;
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
  const mapsA = getTeamMaps(match.rounds, 1);
  const mapsB = getTeamMaps(match.rounds, 2);
  const roundsA = getTeamRounds(match.rounds, 1);
  const roundsB = getTeamRounds(match.rounds, 2);
  const ticketsA = getTeamTickets(match.rounds, 1);
  const ticketsB = getTeamTickets(match.rounds, 2);
  const scoreA = mapsA * 100 + roundsA * 10 + ticketsA;
  const scoreB = mapsB * 100 + roundsB * 10 + ticketsB;
  return [
    {
      match_id: match.id,
      team: 1,
      maps: mapsA,
      rounds: roundsA,
      tickets: ticketsA,
      is_winner: scoreA > scoreB,
    },
    {
      match_id: match.id,
      team: 2,
      maps: mapsB,
      rounds: roundsB,
      tickets: ticketsB,
      is_winner: scoreB > scoreA,
    },
  ];
}

export function calculatePlayerResults(
  match: MatchesJoined
): Array<MatchPlayerResultsInsert> {
  const results = match.rounds
    .map(getPlayerRoundStats)
    .filter(isNotNull)
    .reduce(aggregateRound, {});

  return match.players
    .map((player) =>
      player.keyhash
        ? {
            match_id: match.id,
            player_id: player.id,
            score: results[player.keyhash]?.score || 0,
            deaths: results[player.keyhash]?.deaths || 0,
            kills: results[player.keyhash]?.kills || 0,
            rating_inc: 0,
          }
        : null
    )
    .filter(isNotNull);
}

export function withRatingIncrement(match: MatchesJoined, winnerTeam: number) {
  return (playerResult: MatchPlayerResultsInsert): MatchPlayerResultsInsert => {
    const mp = match.teams.find((mp) => mp.player_id === playerResult.player_id);

    if (!mp || !mp.team) {
      return playerResult;
    }

    return {
      ...playerResult,
      team: mp.team,
      rating_inc: mp.team === winnerTeam ? 1 : -1,
    };
  };
}

export function toPlayerRatingUpdate(players: Array<PlayersRow>) {
  return (playerResult: MatchPlayerResultsInsert): PlayersInsert | null => {
    const player = players.find((p) => p.id === playerResult.player_id);
    if (!player) {
      return null;
    }
    return {
      ...player,
      rating: player.rating + playerResult.rating_inc,
    };
  };
}
