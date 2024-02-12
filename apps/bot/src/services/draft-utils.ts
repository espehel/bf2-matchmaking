import {
  isDefined,
  isRatedMatchPlayer,
  MatchesJoined,
  MatchPlayersInsert,
  MatchPlayersRow,
  RatedMatchPlayer,
} from '@bf2-matchmaking/types';
import { shuffleArray } from '@bf2-matchmaking/utils';
import { Embed } from 'discord.js';
import { getUserIds } from './utils';

export function buildMixTeams(teams: Array<RatedMatchPlayer>): Array<RatedMatchPlayer> {
  const [teamA, teamB] = getTeamsBySnakeDraft(teams);
  const team1 = teamA.sort(compareRating).map(withTeam(1));
  const team2 = teamB.sort(compareRating).map(withTeam(2));
  return team1.concat(team2);
}
export function draftTeams(match: MatchesJoined) {
  const snakeDraftTeams = withAverageRatingAndNick(
    getTeamsBySnakeDraft(match.teams.filter(isRatedMatchPlayer)),
    match
  );
  const teams = withAverageRatingAndNick(getTeams(match.teams), match);
  const actualTeams = withAverageRatingAndNick(getActualTeams(match), match);
  return {
    snakeDraftTeams,
    teams,
    actualTeams,
  };
}

function getActualTeams(
  match: MatchesJoined
): [Array<MatchPlayersRow>, Array<MatchPlayersRow>] {
  return [
    match.teams.filter((p) => p.team === match.home_team.id),
    match.teams.filter((p) => p.team === match.away_team.id),
  ];
}

function getTeamsBySnakeDraft(
  players: Array<RatedMatchPlayer>
): [Array<RatedMatchPlayer>, Array<RatedMatchPlayer>] {
  const sorted = [...players].sort((a, b) => a.rating - b.rating);
  const team1 = [];
  const team2 = [];

  for (let i = 0; i < sorted.length; i++) {
    const round = Math.floor(i / 2);
    if (round % 2 === 0) {
      if (i % 2 === 0) {
        team1.push(sorted[i]);
      } else {
        team2.push(sorted[i]);
      }
    } else {
      if (i % 2 === 0) {
        team2.push(sorted[i]);
      } else {
        team1.push(sorted[i]);
      }
    }
  }
  return [team1, team2];
}

function getTeams(
  players: Array<MatchPlayersRow>
): [Array<MatchPlayersRow>, Array<MatchPlayersRow>] {
  let pool = [...players];
  const poolRating = getAverageRating(players);
  const team1: Array<MatchPlayersRow> = [];
  const team2: Array<MatchPlayersRow> = [];

  while (pool.length > 0) {
    if (pool.length % 2 === 0) {
      const candidate = getCandidate(team1, pool, poolRating);
      team1.push(candidate);
      pool = pool.filter((p) => p.player_id !== candidate.player_id);
    } else {
      const candidate = getCandidate(team2, pool, poolRating);
      team2.push(candidate);
      pool = pool.filter((p) => p.player_id !== candidate.player_id);
    }
  }

  return [team1, team2];
}

function getCandidate(
  team: Array<MatchPlayersRow>,
  pool: Array<MatchPlayersRow>,
  poolRating: number
) {
  let candidate = pool[0];
  for (let i = 1; i < pool.length; i++) {
    if (
      Math.abs(getAverageRating([...team, candidate]) - poolRating) >
      Math.abs(getAverageRating([...team, pool[i]]) - poolRating)
    ) {
      candidate = pool[i];
    }
  }
  return candidate;
}

export function getAverageRating(players: Array<RatedMatchPlayer>) {
  return players.reduce((acc, cur) => acc + cur.rating, 0) / players.length;
}

function withAverageRatingAndNick(
  [team1, team2]: [Array<RatedMatchPlayer>, Array<RatedMatchPlayer>],
  match: MatchesJoined
) {
  return [
    {
      rating: getAverageRating(team1),
      players: team1.map(toPlayerText(match)).filter(isDefined),
    },
    {
      rating: getAverageRating(team2),
      players: team2.map(toPlayerText(match)).filter(isDefined),
    },
  ];
}

function toPlayerText(match: MatchesJoined) {
  return (mp: MatchPlayersInsert) => {
    const player = match.players.find(({ id }) => id === mp.player_id);
    return player && `${player.nick} (${mp.rating})`;
  };
}

function compareRating(mpA: RatedMatchPlayer, mpB: RatedMatchPlayer) {
  return mpB.rating - mpA.rating;
}

function withTeam(team: number) {
  return (mp: RatedMatchPlayer) => {
    return { ...mp, team };
  };
}

export function createDraftList(teams: Array<MatchPlayersInsert>, embed: Embed) {
  const usCaptain = findCaptain(teams, embed, 'USMC');
  const mecCaptain = findCaptain(teams, embed, 'MEC/PLA');

  return shuffleArray(teams)
    .filter(
      (mp) =>
        mp.player_id !== usCaptain?.player_id || mp.player_id !== mecCaptain?.player_id
    )
    .slice(0, -1);
}

function findCaptain(
  teams: Array<MatchPlayersInsert>,
  embed: Embed,
  team: 'USMC' | 'MEC/PLA'
) {
  const captain = getUserIds(embed, team).at(0);
  return teams.find((mp) => mp.player_id === captain);
}
