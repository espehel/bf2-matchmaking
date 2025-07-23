import { isDefined, RatedMatchPlayer } from '@bf2-matchmaking/types';
import { MatchrolesRow } from '@bf2-matchmaking/schemas/types';
import { matches } from '@/lib/supabase/supabase-server';
import { verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { compareRating, shuffleArray } from '@bf2-matchmaking/utils';
import { sumRating } from '@bf2-matchmaking/services/players';

export async function buildTeams(
  matchId: number,
  method: 'random' | 'rating' | 'roles' | string
) {
  const match = await matches.getJoined(matchId).then(verifySingleResult);

  if (method === 'random') {
    return getTeamsByRandom(match.teams);
  }
  let sortedPlayers: Array<RatedMatchPlayer> = [];
  if (method === 'rating') {
    sortedPlayers = match.teams.toSorted(compareRating);
  }
  if (method === 'roles') {
    const roleRatingMap = Object.fromEntries(match.teams.map(toRoleRatingEntry));
    const roles = await matches.roles.get(match.id).then(verifyResult);
    sortedPlayers = match.teams.toSorted(compareRatingAndRole(roleRatingMap, roles));
  }

  return splitSortedPlayers(sortedPlayers);
}

function getTeamsByRandom(players: Array<RatedMatchPlayer>) {
  const randomPlayers = shuffleArray(players);
  return [
    randomPlayers.slice(0, randomPlayers.length / 2),
    randomPlayers.slice(randomPlayers.length / 2, -1),
  ];
}

function toRoleRatingEntry(
  player: RatedMatchPlayer,
  i: number,
  players: Array<RatedMatchPlayer>
) {
  const lowestRank = Math.min(
    ...players.filter((p) => p.role === player.role).map((p) => p.rating)
  );
  const highestRank = Math.max(
    ...players.filter((p) => p.role === player.role).map((p) => p.rating)
  );
  return [player.role || 'unassigned', highestRank - lowestRank] as const;
}

function compareRatingAndRole(
  roleRatingMap: Record<string, number>,
  roles: Array<MatchrolesRow>
) {
  function compareRole(roleA: string, roleB: string) {
    if (roleA === roleB) {
      return 0;
    }
    const roleADiff = roleRatingMap[roleA];
    const roleBDiff = roleRatingMap[roleB];
    if (roleADiff !== roleBDiff) {
      return roleBDiff - roleADiff;
    }

    const aPriority = roles.find((r) => r.name === roleA)?.priority || 0;
    const bPriority = roles.find((r) => r.name === roleB)?.priority || 0;
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }

    return (
      roles.findIndex((r) => r.name === roleB) - roles.findIndex((r) => r.name === roleA)
    );
  }

  return (mpA: RatedMatchPlayer, mpB: RatedMatchPlayer) => {
    if (mpA.role == mpB.role) {
      return mpB.rating - mpA.rating;
    }
    return compareRole(mpA.role || 'unassigned', mpB.role || 'unassigned');
  };
}

function splitSortedPlayers(sortedPlayers: Array<RatedMatchPlayer>) {
  const team1 = [];
  const team2 = [];

  for (let i = 0; i < sortedPlayers.length; i += 2) {
    const team1Sum = team1.reduce(sumRating, 0);
    const team2Sum = team2.reduce(sumRating, 0);
    if (team1Sum < team2Sum) {
      team1.push(sortedPlayers[i]);
      team2.push(sortedPlayers[i + 1]);
    } else {
      team2.push(sortedPlayers[i]);
      team1.push(sortedPlayers[i + 1]);
    }
  }

  return [team1.filter(isDefined), team2.filter(isDefined)];
}
