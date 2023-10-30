'use server';
import { api, assertString } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { isScheduledMatch, isString } from '@bf2-matchmaking/types';
import { revalidatePath } from 'next/cache';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { postGuildScheduledEvent } from '@bf2-matchmaking/discord';
import { match } from 'assert';
import { createScheduledMatchEvent } from '@bf2-matchmaking/discord/src/discord-scheduled-events';
export async function createScheduledMatch(formData: FormData) {
  try {
    const {
      configSelect,
      scheduledInput,
      homeSelect,
      awaySelect,
      serverSelect,
      timezone,
    } = Object.fromEntries(formData);

    assertString(configSelect);
    assertString(homeSelect);
    assertString(awaySelect);

    assertString(scheduledInput);
    assertString(timezone);
    const scheduled_at = DateTime.fromISO(scheduledInput)
      .setZone(timezone)
      .toUTC()
      .toISO();
    assertString(scheduled_at);

    const { data: player } = await supabase(cookies).getSessionPlayer();
    const result = await supabase(cookies).createScheduledMatch(
      Number(configSelect),
      Number(homeSelect),
      Number(awaySelect),
      scheduled_at,
      isString(serverSelect) ? serverSelect : null
    );

    if (result.error) {
      logErrorMessage('Failed to schedule match', result.error, {
        player,
        configSelect,
        homeSelect,
        awaySelect,
        scheduled_at,
        serverSelect,
      });
      return;
    }
    const match = result.data;
    if (match.config.guild && isScheduledMatch(match)) {
      const { data: event, error: discordError } = await postGuildScheduledEvent(
        match.config.guild,
        createScheduledMatchEvent(match)
      );
      console.log('EVENT:');
      console.log(event);
      if (event) {
        await supabase(cookies).updateMatch(match.id, { events: [event.id] });
      } else {
        logErrorMessage('Failed to post scheduled event to discord', discordError, {
          match,
        });
      }

      revalidatePath('/matches/scheduled');
      logMessage(`Match ${result.data.id} scheduled by ${player?.full_name}`, {
        match: result.data,
        player,
        scheduledInput,
        timezone,
        event,
      });
    }

    return result;
  } catch (e) {
    if (isString(e)) {
      return { data: null, error: { message: e } };
    }
    return { data: null, error: e };
  }
}
