'use server';
import { assertString } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';

export async function createScheduledMatch(formData: FormData) {
  const { configSelect, scheduledInput, homeSelect, awaySelect, serverSelect, timezone } =
    Object.fromEntries(formData);
  console.log(configSelect);
  console.log(scheduledInput);
  console.log(timezone);
  console.log(homeSelect);
  console.log(awaySelect);
  console.log(serverSelect);
  assertString(scheduledInput);
  assertString(timezone);
  const scheduled_at = DateTime.fromISO(scheduledInput).setZone(timezone).toUTC().toISO();
  console.log(scheduled_at);
}
