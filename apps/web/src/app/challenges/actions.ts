'use server';
import { getOptionalValues, getValues } from '@bf2-matchmaking/utils/src/form-data';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { assertNumber, assertString } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import { ChallengesRow, ChallengesUpdate } from '@bf2-matchmaking/types';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import { createMatch, createMatchMaps, createMatchServers } from '@/app/matches/actions';

export async function createChallenge(formData: FormData) {
  const { configSelect, homeTeam, homeMap, homeServer, scheduledInput, timezone } =
    getValues(
      formData,
      'configSelect',
      'homeTeam',
      'homeMap',
      'homeServer',
      'scheduledInput',
      'timezone'
    );
  const scheduled_at = DateTime.fromISO(scheduledInput, { zone: timezone })
    .toUTC()
    .toISO();
  assertString(scheduled_at);

  const { awayTeam } = getOptionalValues(formData, 'awayTeam');

  const res = await supabase(cookies).createChallenge({
    config: Number(configSelect),
    home_team: Number(homeTeam),
    away_team: awayTeam !== null ? Number(awayTeam) : null,
    home_map: Number(homeMap),
    home_server: homeServer,
    scheduled_at,
  });

  if (!res.error) {
    revalidatePath('/challenges');
  }
  return res;
}

export async function acceptChallenge(formData: FormData) {
  const { challengeId, awayTeam, awayMap, awayServer } = getValues(
    formData,
    'challengeId',
    'awayTeam',
    'awayMap',
    'awayServer'
  );

  const updatedChallenge = await updateChallenge(Number(challengeId), {
    away_team: Number(awayTeam),
    away_map: Number(awayMap),
    away_server: awayServer,
    status: 'pending',
  }).then(verifySingleResult);
  const match = await createMatchFromChallenge(updatedChallenge);

  const res = await updateChallenge(Number(challengeId), {
    match: match.id,
    status: 'accepted',
  });
  if (!res.error) {
    revalidatePath('/challenges');
  }
  return res;
}

export async function updateChallenge(challengeId: number, values: ChallengesUpdate) {
  const res = await supabase(cookies).updateChallenge(challengeId, values);
  if (!res.error) {
    revalidatePath('/challenges');
  }
  return res;
}

export async function createMatchFromChallenge(challenge: ChallengesRow) {
  assertNumber(challenge.away_team);
  assertNumber(challenge.away_map);
  assertString(challenge.away_server);

  const match = await createMatch(challenge.config, {
    scheduled_at: challenge.scheduled_at,
    home_team: challenge.home_team,
    away_team: challenge.away_team,
  }).then(verifySingleResult);

  await createMatchServers(match.id, [challenge.home_server, challenge.away_server]);
  await createMatchMaps(match.id, [challenge.home_map, challenge.away_map]);
  return match;
}
