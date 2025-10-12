import { assertNumber, assertString } from '@bf2-matchmaking/utils';
import { events, supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  EventMatchesRow,
  EventRoundsRow,
  EventsJoined,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { getValue, getValues } from '@bf2-matchmaking/utils/form';
import { DateTime } from 'luxon';
import { matchApi } from '@/lib/match';

export async function addRoundMatch(
  event: EventsJoined,
  round: EventRoundsRow,
  data: FormData
) {
  const home_team = Number(data.get('home_team[id]'));
  const away_team = Number(data.get('away_team[id]'));
  assertNumber(home_team, 'Missing home team');
  assertNumber(away_team, 'Missing away team');

  const cookieStore = await cookies();

  const match = await matchApi.create({
    config: event.config,
    status: MatchStatus.Scheduled,
    scheduled_at: round.start_at,
    home_team,
    away_team,
  });

  const result = await events.matches.create({
    event: event.id,
    round: round.id,
    match: match.id,
  });

  if (result.data) {
    revalidatePath(`/events/${event.id}`);
  }

  return result;
}
export async function addEventTeam(data: FormData) {
  'use server';
  const teamId = Number(getValue(data, 'team[id]'));
  const eventId = Number(getValue(data, 'event'));

  const cookieStore = await cookies();
  const result = await supabase(cookieStore).createEventTeam(eventId, teamId);

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

  const startDateTime = DateTime.fromISO(startAt)
    .set({ hour: 21 })
    .setZone('Europe/Paris')
    .toISO();
  assertString(startDateTime, 'Failed to set start time and zone');

  const cookieStore = await cookies();
  const result = await supabase(cookieStore).createEventRound(
    eventId,
    label,
    startDateTime
  );

  if (result.data) {
    revalidatePath(`/events/${eventId}`);
  }

  return result;
}

export async function deleteEventRound(
  round: EventRoundsRow & { matches: Array<EventMatchesRow> }
) {
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).deleteEventRound(round.id);
  if (result.data) {
    await Promise.all(
      round.matches.map(({ match }) => supabase(cookieStore).deleteMatch(match))
    );
    revalidatePath(`/events/${round.event}`);
  }
  return result;
}

export async function deleteEventMatch({ match, event }: EventMatchesRow) {
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).deleteEventMatch(match);
  if (result.data) {
    await supabase(cookieStore).deleteMatch(match);
    revalidatePath(`/events/${event}`);
  }
  return result;
}

export async function deleteEventTeam(event: EventsJoined, teamId: number) {
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).deleteEventTeam(event.id, teamId);
  if (result.data) {
    await Promise.all(
      event.matches
        .filter((m) => m.home_team.id === teamId || m.away_team.id === teamId)
        .map((m) => supabase(cookieStore).deleteMatch(m.id))
    );
    revalidatePath(`/events/${event.id}`);
  }
  return result;
}

export async function setEventOpen(formData: FormData) {
  'use server';
  const { open, event } = getValues(formData, 'open', 'event');
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).updateEvent(Number(event), {
    open: open === 'true',
  });
  if (!result.error) {
    revalidatePath(`/events/${event}`);
  }
  return result;
}
