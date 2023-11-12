'use server';
import { assertString } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { isScheduledMatch, isString } from '@bf2-matchmaking/types';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { postGuildScheduledEvent } from '@bf2-matchmaking/discord';
import { createScheduledMatchEvent } from '@bf2-matchmaking/discord/src/discord-scheduled-events';
import { redirect } from 'next/navigation';
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

      if (event) {
        await supabase(cookies).updateMatch(match.id, { events: [event.id] });
      } else {
        logErrorMessage('Failed to post scheduled event to discord', discordError, {
          match,
        });
      }

      logMessage(`Match ${result.data.id} scheduled by ${player?.full_name}`, {
        match: result.data,
        player,
        scheduledInput,
        timezone,
        event,
      });
      redirect(`/matches/${match.id}`);
    }

    return result;
  } catch (e) {
    if (isString(e)) {
      return { data: null, error: { message: e } };
    }
    return { data: null, error: e };
  }
}
