'use server';
import { getOptionalValue, getValues } from '@bf2-matchmaking/utils/src/form-data';
import { matches } from '@/lib/supabase/supabase-server';
import { publicMatchRoleSchema } from '@bf2-matchmaking/schemas';
import { revalidatePath } from 'next/cache';
import { ActionInput } from '@/hooks/useAction';
import {
  getTeamsByRandom,
  getTeamsByRating,
} from '@bf2-matchmaking/utils/src/draft-utils';
import { MatchesJoined } from '@bf2-matchmaking/types';
import {
  assertNumber,
  assertString,
  parseError,
  toFetchError,
} from '@bf2-matchmaking/utils';
import { verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';

export async function setPlayerRating(formData: FormData) {
  const { matchId, playerId, rating } = getValues(
    formData,
    'matchId',
    'playerId',
    'rating'
  );
  const result = await matches.players.update(matchId, [playerId], {
    rating: Number(rating),
  });
  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }
  return result;
}

export async function setMatchPlayerRole(formData: FormData) {
  const { matchId, playerId } = getValues(formData, 'matchId', 'playerId');
  const role = publicMatchRoleSchema.parse(formData.get('role'));
  const result = await matches.players.update(matchId, [playerId], { role });
  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }
  return result;
}

export async function setMatchPlayerTeam(formData: FormData) {
  const { matchId, playerId } = getValues(formData, 'matchId', 'playerId', 'team');
  const team = getOptionalValue(formData, 'team');
  const result = await matches.players.update(matchId, [playerId], {
    team: team ? Number(team) : null,
  });
  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }
  return result;
}

export async function setMatchPlayerTeams(input: ActionInput) {
  try {
    const { matchId, method } = input;
    assertNumber(matchId);
    assertString(method);
    const match = await matches.getJoined(matchId).then(verifySingleResult);

    const [teamA, teamB] = getTeams(match, method);
    console.log(teamA);
    console.log(teamB);
    // TODO how to sync redis?
    await matches.players
      .update(
        matchId,
        teamA.map((mp) => mp.player_id),
        { team: 1 }
      )
      .then(verifyResult);
    await matches.players
      .update(
        matchId,
        teamB.map((mp) => mp.player_id),
        { team: 2 }
      )
      .then(verifyResult);

    revalidatePath(`/matches/${matchId}`);
    return { success: 'Teams updated', error: null };
  } catch (e) {
    return { success: null, error: parseError(e) };
  }
}
function getTeams(match: MatchesJoined, method: 'random' | 'rating' | string) {
  switch (method) {
    case 'random':
      return getTeamsByRandom(match.teams);
    case 'rating':
      return getTeamsByRating(match.teams);
    default:
      throw Error(`Unknown team method: ${method}`);
  }
}
