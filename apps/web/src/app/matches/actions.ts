'use server';
import { assertString } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { isScheduledMatch, isString } from '@bf2-matchmaking/types';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { postGuildScheduledEvent } from '@bf2-matchmaking/discord';
import { createScheduledMatchEvent } from '@bf2-matchmaking/discord/src/discord-scheduled-events';
import { revalidatePath } from 'next/cache';
import { getArray } from '@bf2-matchmaking/utils/src/form-data';
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
    assertString(configSelect, 'Match type is required.');
    assertString(homeSelect, 'Home team is required.');
    assertString(awaySelect, 'Away team is required.');
    assertString(scheduledInput, 'Match start is required.');
    assertString(timezone);
    const scheduled_at = DateTime.fromISO(scheduledInput, { zone: timezone })
      .toUTC()
      .toISO();
    assertString(scheduled_at);
    const mapsSelect = getArray(formData, 'mapsSelect');

    if (homeSelect === awaySelect) {
      return { data: null, error: { message: 'Home and away team cannot be the same.' } };
    }

    const { data: player } = await supabase(cookies).getSessionPlayer();
    const result = await supabase(cookies).createScheduledMatch(
      Number(configSelect),
      Number(homeSelect),
      Number(awaySelect),
      scheduled_at,
      isString(serverSelect) && serverSelect.length > 0 ? serverSelect : null
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
      return result;
    }
    const match = result.data;

    const mapsResult = await supabase(cookies).createMatchMaps(
      match.id,
      ...mapsSelect.map(Number)
    );
    if (mapsResult.error) {
      logErrorMessage('Failed to set maps', mapsResult.error, {
        match,
        mapsSelect,
        player,
      });
    }

    if (match.config.guild && isScheduledMatch(match)) {
      const { data } = await supabase(cookies).getMatch(match.id);
      const updatedMatch = data && isScheduledMatch(data) ? data : match;
      const { data: event, error: discordError } = await postGuildScheduledEvent(
        match.config.guild,
        createScheduledMatchEvent(updatedMatch)
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
        mapsSelect,
      });
    }
    revalidatePath('/matches/schedule');
    return result;
  } catch (e) {
    console.error(e);
    if (isString(e)) {
      return { data: null, error: { message: e } };
    }
    if (e instanceof Error) {
      return { data: null, error: { message: e.message } };
    }
    return { data: null, error: { message: JSON.stringify(e) } };
  }
}
