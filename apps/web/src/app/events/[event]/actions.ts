import { assertNumber, assertString } from '@bf2-matchmaking/utils';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { EventRoundsRow, EventsJoined, RoundsRow } from '@bf2-matchmaking/types';
import { verifySingleResult } from '@bf2-matchmaking/supabase';

export async function addRoundMatch(
  event: EventsJoined,
  round: EventRoundsRow,
  data: FormData
) {
  const homeTeam = Number(data.get('home_team[id]'));
  const awayTeam = Number(data.get('away_team[id]'));
  assertNumber(homeTeam, 'Missing home team');
  assertNumber(awayTeam, 'Missing away team');

  const match = await supabase(cookies)
    .createScheduledMatch(event.config, homeTeam, awayTeam, round.start_at)
    .then(verifySingleResult);

  const result = await supabase(cookies).createEventMatch(event.id, round.id, match.id);

  if (result.data) {
    revalidatePath(`/events/${event.id}`);
  }

  return result;
}
export async function addEventTeam(eventId: number, data: FormData) {
  const teamId = Number(data.get('team[id]'));
  assertNumber(teamId, 'Missing teamId');

  const result = await supabase(cookies).createEventTeam(eventId, teamId);

  if (result.data) {
    revalidatePath(`/events/${eventId}`);
  }

  return result;
}

export async function addEventRound(eventId: number, data: FormData) {
  const label = data.get('label');
  const startAt = data.get('start-at');
  assertString(label, 'Missing label');
  assertString(startAt, 'Missing startAt');

  const result = await supabase(cookies).createEventRound(eventId, label, startAt);

  if (result.data) {
    revalidatePath(`/events/${eventId}`);
  }

  return result;
}
