import { isDefined, MatchesJoined, MatchPlayersRow } from '@bf2-matchmaking/types';
import { getCurrentTeam, shuffleArray } from '@bf2-matchmaking/utils';

export function buildMixTeams(match: MatchesJoined) {
  const [teamA, teamB] = getTeamsBySnakeDraft(match.teams);
  const team1 = teamA.sort(compareRating).map(withTeamAndCaptain(1));
  const team2 = teamB.sort(compareRating).map(withTeamAndCaptain(2));
  return team1.concat(team2);
}
export function draftTeams(match: MatchesJoined) {
  const snakeDraftTeams = withAverageRatingAndNick(
    getTeamsBySnakeDraft(match.teams),
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
  players: Array<MatchPlayersRow>
): [Array<MatchPlayersRow>, Array<MatchPlayersRow>] {
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

export function getAverageRating(players: Array<MatchPlayersRow>) {
  return players.reduce((acc, cur) => acc + cur.rating, 0) / players.length;
}

function withAverageRatingAndNick(
  [team1, team2]: [Array<MatchPlayersRow>, Array<MatchPlayersRow>],
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
  return (mp: MatchPlayersRow) => {
    const player = match.players.find(({ id }) => id === mp.player_id);
    return player && `${player.nick} (${mp.rating})`;
  };
}

function compareRating(mpA: MatchPlayersRow, mpB: MatchPlayersRow) {
  return mpB.rating - mpA.rating;
}

function withTeamAndCaptain(team: number) {
  return (mp: MatchPlayersRow, index: number) => {
    if (index === 0) {
      return { ...mp, captain: true, team };
    }
    return { ...mp, captain: false, team };
  };
}

export function createDraftList(teams: Array<MatchPlayersRow>) {
  let draftPool = shuffleArray(teams);
  const draftList = [];
  for (let i = 0; i < teams.length; i++) {
    const team = getCurrentTeam(draftPool.length);
    if (!team) {
      continue;
    }
    const mp = draftPool.find((mp) => mp.team === team);
    if (!mp) {
      continue;
    }
    draftList.push(mp);
    draftPool = draftPool.filter((mp) => mp.team !== team);
  }
  return draftList;
}
