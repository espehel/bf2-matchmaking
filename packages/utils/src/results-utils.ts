import {
  isNotNull,
  MatchesJoined,
  RoundStats,
  MatchResultsInsert,
  RoundsJoined,
  MatchPlayerResultsInsert,
  LiveInfo,
  MatchPlayersRow,
  PlayerRatingsInsert,
  PlayerRatingsRow,
  PlayerResultInfo,
  MatchResultInfo,
  MatchResultsJoined,
} from '@bf2-matchmaking/types';
import { parseJSON } from './json-utils';
import { isTeam } from './team-utils';
import { DateTime } from 'luxon';

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

export function calculateWinner(
  homeTuple: [number, number, number],
  awayTuple: [number, number, number]
) {
  const [mapsHome, roundsHome, ticketsHome] = homeTuple;
  const [mapsAway, roundsAway, ticketsAway] = awayTuple;
  const scoreHome = mapsHome * 1000 + ticketsHome;
  const scoreAway = mapsAway * 1000 + ticketsAway;
  return [scoreHome > scoreAway, scoreAway > scoreHome];
}

export function calculateMatchResults(
  match: MatchesJoined
): [MatchResultsInsert, MatchResultsInsert] {
  const [roundsHome, roundsAway] = getRoundsTuple(match.rounds, match);
  const [mapsHome, mapsAway] = getMapsTuple(match.rounds, match);
  const [ticketsHome, ticketsAway] = getTicketsTuple(match.rounds, match);

  const [isHomeWinner, isAwayWinner] = calculateWinner(
    [mapsHome, roundsHome, ticketsHome],
    [mapsAway, roundsAway, ticketsAway]
  );
  let [ratingIncHome, ratingIncAway]: [number | null, number | null] = [null, null];
  if (match.config.type === 'Ladder') {
    ratingIncHome = mapsHome + (isHomeWinner ? 1 : 0);
    ratingIncAway = mapsAway + (isAwayWinner ? 1 : 0);
  }

  return [
    {
      match_id: match.id,
      team: match.home_team.id,
      maps: mapsHome,
      rounds: roundsHome,
      tickets: ticketsHome,
      is_winner: isHomeWinner,
      rating_inc: ratingIncHome,
    },
    {
      match_id: match.id,
      team: match.away_team.id,
      maps: mapsAway,
      rounds: roundsAway,
      tickets: ticketsAway,
      is_winner: isAwayWinner,
      rating_inc: ratingIncAway,
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

export function calculateMatchTeamRating(
  matchPlayers: Array<MatchPlayersRow>,
  teamId: number
) {
  const players = matchPlayers.filter(isTeam(teamId));
  return players.length > 0
    ? players.reduce((sum, mp) => sum + mp.rating, 0) / players.length
    : 0;
}

export function withMixRatingIncrement(
  match: MatchesJoined,
  resultsHome: MatchResultsInsert,
  resultsAway: MatchResultsInsert
) {
  const winnerTeamId = resultsHome.is_winner
    ? resultsHome.team
    : resultsAway.is_winner
    ? resultsAway.team
    : null;

  const homeTeamRating = calculateMatchTeamRating(match.teams, match.home_team.id);
  const awayTeamRating = calculateMatchTeamRating(match.teams, match.away_team.id);

  const matchResultInfo: MatchResultInfo = {
    homeTeam: match.home_team.name,
    homeTeamRating,
    homeTeamTickets: resultsHome.tickets,
    awayTeam: match.away_team.name,
    awayTeamRating,
    awayTeamTickets: resultsAway.tickets,
    type: match.config.type,
    name: match.config.name,
  };

  return (playerResult: MatchPlayerResultsInsert): MatchPlayerResultsInsert => {
    const mp = match.teams.find((mp) => mp.player_id === playerResult.player_id);

    if (!mp || !mp.team) {
      return playerResult;
    }

    const [rating, opponentRating] =
      mp.team === match.home_team.id
        ? [homeTeamRating, awayTeamRating]
        : [awayTeamRating, homeTeamRating];

    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - rating) / 400));
    const actualScore = winnerTeamId === null ? 0.5 : winnerTeamId === mp.team ? 1 : 0;
    const rating_inc = Math.round(K_FACTOR * (actualScore - expectedScore));

    return {
      ...playerResult,
      team: mp.team,
      info: {
        ...matchResultInfo,
        ...createPlayerResultInfo(match, actualScore, mp),
      },
      rating_inc,
    };
  };
}

export function withJoinTime(match: MatchesJoined) {
  return (playerResult: MatchPlayerResultsInsert): MatchPlayerResultsInsert => {
    const joinedAt = match.teams.find(
      ({ player_id }) => player_id === playerResult.player_id
    )?.connected_at;

    if (!joinedAt || !match.started_at) {
      return playerResult;
    }

    return {
      ...playerResult,
      join_time:
        DateTime.fromISO(joinedAt).toMillis() -
        DateTime.fromISO(match.started_at).toMillis(),
    };
  };
}

export function toPlayerRatingUpdate(players: Array<PlayerRatingsRow>, config: number) {
  return (playerResult: MatchPlayerResultsInsert): PlayerRatingsInsert | null => {
    const playerRating =
      players.find((p) => p.player_id === playerResult.player_id)?.rating || 1500; // TODO: Get this from match player

    if (!playerResult.rating_inc) {
      return null;
    }

    return {
      player_id: playerResult.player_id,
      config,
      rating: playerRating + playerResult.rating_inc,
    };
  };
}

export function createPlayerResultInfo(
  match: MatchesJoined,
  score: number,
  mp: MatchPlayersRow
): Omit<PlayerResultInfo, keyof MatchResultInfo> {
  return {
    score,
    rating: mp.rating,
    playerTeam:
      mp.team === match.home_team.id ? match.home_team.name : match.away_team.name,
  };
}

export function calculateLeaguePoints(
  home: MatchResultsJoined,
  away: MatchResultsJoined
) {
  const scoreHome = home.maps + (home.tickets > away.tickets ? 1 : 0);
  const scoreAway = away.maps + (away.tickets > home.tickets ? 1 : 0);
  return [scoreHome, scoreAway];
}
