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
  LiveInfo,
  MatchPlayersRow,
  PlayerRatingsInsert,
  PlayerRatingsRow,
} from '@bf2-matchmaking/types';
import { parseJSON } from './json-utils';
import { isTeam } from './team-utils';

const K_FACTOR = 32;
export const getPlayerRoundStats = (
  round: RoundsJoined
): Record<string, RoundStats> | null => {
  try {
    const info = parseJSON<LiveInfo>(round.info);
    return info.players
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

export function getTicketsTuple(
  rounds: Array<RoundsJoined>,
  match: MatchesJoined
): [number, number] {
  return rounds
    .map((round) =>
      round.team1.id === match.home_team.id
        ? [round.team1_tickets, round.team2_tickets]
        : [round.team2_tickets, round.team1_tickets]
    )
    .reduce(
      ([acc1, acc2], [cur1, cur2]) => [acc1 + parseInt(cur1), acc2 + parseInt(cur2)],
      [0, 0]
    );
}

export function getRoundsTuple(rounds: Array<RoundsJoined>, match: MatchesJoined) {
  const toTicketsTuple = (tickets1: string, tickets2: string) => [
    Number(tickets1) - Number(tickets2) > 0 ? 1 : 0,
    Number(tickets2) - Number(tickets1) > 0 ? 1 : 0,
  ];

  return rounds
    .map((round) =>
      round.team1.id === match.home_team.id
        ? toTicketsTuple(round.team1_tickets, round.team2_tickets)
        : toTicketsTuple(round.team2_tickets, round.team1_tickets)
    )
    .reduce(([acc1, acc2], [cur1, cur2]) => [acc1 + cur1, acc2 + cur2], [0, 0]);
}

export function getMapsTuple(rounds: Array<RoundsJoined>, match: MatchesJoined) {
  let mapsWon = [0, 0];
  for (let i = 0; i < rounds.length; i += 2) {
    if (i + 2 > rounds.length) {
      break;
    }

    const [homeTickets, awayTickets] = getTicketsTuple(rounds.slice(i, i + 2), match);
    if (homeTickets > awayTickets) {
      mapsWon[0]++;
    }
    if (awayTickets > homeTickets) {
      mapsWon[1]++;
    }
  }
  return mapsWon;
}

export function calculateMatchResults(
  match: MatchesJoined
): [MatchResultsInsert, MatchResultsInsert] {
  const [mapsHome, mapsAway] = getMapsTuple(match.rounds, match);
  const [roundsHome, roundsAway] = getRoundsTuple(match.rounds, match);
  const [ticketsHome, ticketsAway] = getTicketsTuple(match.rounds, match);

  const scoreHome = mapsHome * 1000 + ticketsHome;
  const scoreAway = mapsAway * 1000 + ticketsAway;

  return [
    {
      match_id: match.id,
      team: 1,
      maps: mapsHome,
      rounds: roundsHome,
      tickets: ticketsHome,
      is_winner: scoreHome > scoreAway,
    },
    {
      match_id: match.id,
      team: 2,
      maps: mapsAway,
      rounds: roundsAway,
      tickets: ticketsAway,
      is_winner: scoreAway > scoreHome,
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
            rating_inc: null,
          }
        : null
    )
    .filter(isNotNull);
}

export function withMixRatingIncrement(
  match: MatchesJoined,
  winnerTeamId: number | null
) {
  const homeTeam = match.teams.filter(isTeam(match.home_team.id));
  const homeTeamRating =
    homeTeam.reduce((sum, mp) => sum + mp.rating, 0) / homeTeam.length;
  const awayTeam = match.teams.filter(isTeam(match.away_team.id));
  const awayTeamRating =
    awayTeam.reduce((sum, mp) => sum + mp.rating, 0) / awayTeam.length;

  return (playerResult: MatchPlayerResultsInsert): MatchPlayerResultsInsert => {
    const mp = match.teams.find((mp) => mp.player_id === playerResult.player_id);

    if (!mp || !mp.team) {
      return playerResult;
    }

    const opponentRating =
      mp.team === match.home_team.id ? awayTeamRating : homeTeamRating;

    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - mp.rating) / 400));
    const actualScore = winnerTeamId === null ? 0.5 : (winnerTeamId = mp.team ? 1 : 0);
    const rating_inc = K_FACTOR * (actualScore - expectedScore);

    return {
      ...playerResult,
      team: mp.team,
      rating_inc,
    };
  };
}

export function toPlayerRatingUpdate(players: Array<PlayerRatingsRow>) {
  return (playerResult: MatchPlayerResultsInsert): PlayerRatingsInsert | null => {
    const player = players.find((p) => p.player_id === playerResult.player_id);

    if (!player || !playerResult.rating_inc) {
      return null;
    }

    return {
      player_id: player.player_id,
      config: player.config,
      rating: player.rating + playerResult.rating_inc,
    };
  };
}
