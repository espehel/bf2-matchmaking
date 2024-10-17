'use server';
import {
  getOptionalValue,
  getOptionalValues,
  getValues,
} from '@bf2-matchmaking/utils/src/form-data';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { api, assertNumber, assertString, verify } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import {
  ChallengesRow,
  ChallengesUpdate,
  MatchesInsert,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import { createMatchServers } from '@/app/matches/actions';

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

  const awayTeam = getOptionalValue(formData, 'awayTeam');

  const res = await supabase(cookies).createChallenge({
    config: Number(configSelect),
    home_team: Number(homeTeam),
    home_map: Number(homeMap),
    home_server: homeServer,
    away_team: awayTeam !== null ? Number(awayTeam) : null,
    status: awayTeam !== null ? 'pending' : 'open',
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

  const { scheduledInput, timezone } = getOptionalValues(
    formData,
    'scheduledInput',
    'timezone'
  );

  const scheduled_at =
    scheduledInput &&
    timezone &&
    DateTime.fromISO(scheduledInput, { zone: timezone }).toUTC().toISO();

  const updatedChallenge = await updateChallenge(Number(challengeId), {
    away_team: Number(awayTeam),
    away_map: Number(awayMap),
    away_server: awayServer,
    status: 'pending',
  }).then(verifySingleResult);

  if (
    scheduled_at &&
    DateTime.fromISO(scheduled_at).toMillis() !==
      DateTime.fromISO(updatedChallenge.scheduled_at).toMillis()
  ) {
    return updateChallenge(updatedChallenge.id, {
      scheduled_at,
      home_accepted: !updatedChallenge.home_accepted,
      away_accepted: !updatedChallenge.away_accepted,
    });
  }

  const match = await createMatchFromChallenge(updatedChallenge);

  return updateChallenge(Number(challengeId), {
    match: match.id,
    status: 'accepted',
  });
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

  const matchValues: MatchesInsert = {
    config: challenge.config,
    status: MatchStatus.Scheduled,
    scheduled_at: challenge.scheduled_at,
    home_team: challenge.home_team,
    away_team: challenge.away_team,
  };

  const match = await api.v2
    .postMatch({
      matchValues,
      matchMaps: [challenge.home_map, challenge.away_map],
      matchTeams: null,
    })
    .then(verify);

  const servers =
    challenge.home_server === challenge.away_server
      ? [challenge.home_server]
      : [challenge.home_server, challenge.away_server];
  await createMatchServers(match.id, servers);
  return match;
}
