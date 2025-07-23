'use server';
import { getOptionalValue, getValues } from '@bf2-matchmaking/utils/src/form-data';
import { matches, players } from '@/lib/supabase/supabase-server';
import { publicMatchRoleSchema } from '@bf2-matchmaking/schemas';
import { revalidatePath } from 'next/cache';
import { assertNumber, assertString, parseError } from '@bf2-matchmaking/utils';
import { ActionResult, ActionInput } from '@/lib/types/form';
import { verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { buildTeams } from '@/lib/team-builder';

export async function updateMatchPlayer(input: ActionInput): Promise<ActionResult> {
  try {
    const { matchId, playerId, ...values } = input;
    assertNumber(matchId);
    assertString(playerId);
    await matches.players.update(matchId, [playerId], values).then(verifyResult);
    revalidatePath(`/matches/${matchId}`);
    return { success: 'Match Player updated', error: null, ok: true };
  } catch (e) {
    return { success: null, error: parseError(e), ok: false };
  }
}

export async function resetMatchPlayersRating(input: ActionInput): Promise<ActionResult> {
  try {
    const { matchId } = input;
    assertNumber(matchId);
    const match = await matches.getJoined(matchId).then(verifySingleResult);

    const ratings = await players.ratings
      .get(
        match.config.id,
        match.players.map((p) => p.id)
      )
      .then(verifyResult);

    const matchPlayerRatings = match.players.map((p) => {
      const rating = ratings.find((r) => r.player_id === p.id);
      return {
        match_id: matchId,
        player_id: p.id,
        rating: rating ? rating.rating : 1500,
      };
    });

    await matches.players.upsert(matchPlayerRatings).then(verifyResult);

    revalidatePath(`/matches/${matchId}`);
    return { success: 'Player rating updated', error: null, ok: true };
  } catch (e) {
    return { success: null, error: parseError(e), ok: false };
  }
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

export async function setMatchPlayerTeams(input: ActionInput): Promise<ActionResult> {
  try {
    const { matchId, method } = input;
    assertNumber(matchId);
    assertString(method);

    const [teamA, teamB] = await buildTeams(matchId, method);

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
    return { success: 'Teams updated', error: null, ok: true };
  } catch (e) {
    return { success: null, error: parseError(e), ok: false };
  }
}
