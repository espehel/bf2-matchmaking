'use server';
import { revalidatePath } from 'next/cache';
import { api, assertNumber, assertString } from '@bf2-matchmaking/utils';
import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { calculateWinner } from '@bf2-matchmaking/utils/src/results-utils';
import { DateTime } from 'luxon';

export async function closeMatch(matchId: number) {
  const result = await supabase(cookies).updateMatch(matchId, {
    status: MatchStatus.Closed,
    closed_at: DateTime.now().toISO(),
  });

  if (!result.error) {
    revalidatePath(`/matches/${matchId}`);
  }

  return result;
}

export async function reopenMatch(matchId: number) {
  const result = await supabase(cookies).updateMatch(matchId, {
    status: MatchStatus.Finished,
    closed_at: null,
  });

  if (!result.error) {
    revalidatePath(`/results/${matchId}`);
  }
  return result;
}

export async function addResult(match: MatchesJoined, data: FormData) {
  const obj = Object.fromEntries(
    Array.from(data.entries()).map(([key, value]) => {
      return [key, Number(value)];
    })
  );
  console.log(obj);
  const {
    homeRoundInput,
    homeMapsInput,
    homeTicketsInput,
    awayRoundInput,
    awayMapsInput,
    awayTicketsInput,
  } = obj;

  try {
    assertNumber(homeMapsInput);
    assertNumber(homeRoundInput);
    assertNumber(homeTicketsInput);
    assertNumber(awayMapsInput);
    assertNumber(awayRoundInput);
    assertNumber(awayTicketsInput);
  } catch (e) {
    return { data: null, error: { message: 'Missing input values' } };
  }

  const [isHomeWinner, isAwayWinner] = calculateWinner(
    [homeMapsInput, homeRoundInput, homeTicketsInput],
    [awayMapsInput, awayRoundInput, awayTicketsInput]
  );

  const [homeResult, awayResult] = await Promise.all([
    supabase(cookies).createMatchResult({
      match_id: match.id,
      team: match.home_team.id,
      rounds: Number(homeRoundInput),
      maps: Number(homeMapsInput),
      tickets: Number(homeTicketsInput),
      is_winner: isHomeWinner,
    }),
    supabase(cookies).createMatchResult({
      match_id: match.id,
      team: match.away_team.id,
      rounds: Number(awayRoundInput),
      maps: Number(awayMapsInput),
      tickets: Number(awayTicketsInput),
      is_winner: isAwayWinner,
    }),
  ]);

  if (homeResult.error) {
    return homeResult;
  }
  if (awayResult.error) {
    return awayResult;
  }

  await supabase(cookies).updateMatch(match.id, {
    status: MatchStatus.Closed,
    closed_at: DateTime.now().toISO(),
  });

  revalidatePath(`/results/${match.id}`);

  return { data: [homeResult, awayResult], error: null };
}
