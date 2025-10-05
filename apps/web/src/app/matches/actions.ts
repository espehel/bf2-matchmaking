'use server';
import { assertString, toFetchError } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { isScheduledMatch, MatchesInsert, MatchStatus } from '@bf2-matchmaking/types';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import {
  postGuildScheduledEvent,
  createScheduledMatchEvent,
} from '@bf2-matchmaking/discord';
import { revalidatePath } from 'next/cache';
import { getArray } from '@bf2-matchmaking/utils/form';
import { api } from '@bf2-matchmaking/services/api';
export async function createScheduledMatch(formData: FormData) {
  try {
    const { configSelect, scheduledInput, homeSelect, awaySelect, timezone } =
      Object.fromEntries(formData);
    assertString(configSelect, 'Match type is required.');
    assertString(homeSelect, 'Home team is required.');
    assertString(awaySelect, 'Away team is required.');
    assertString(scheduledInput, 'Match start is required.');
    assertString(timezone);
    const scheduled_at = DateTime.fromISO(scheduledInput, { zone: timezone })
      .toUTC()
      .toISO();
    assertString(scheduled_at);

    const serverSelect = getArray(formData, 'serverSelect');
    const mapSelect = getArray(formData, 'mapSelect');

    if (homeSelect === awaySelect) {
      return { data: null, error: { message: 'Home and away team cannot be the same.' } };
    }
    const cookieStore = await cookies();
    const { data: player } = await supabase(cookieStore).getSessionPlayer();
    const matchValues: MatchesInsert = {
      config: Number(configSelect),
      status: MatchStatus.Scheduled,
      scheduled_at,
      home_team: Number(homeSelect),
      away_team: Number(awaySelect),
    };
    const matchMaps = mapSelect.map(Number);
    const result = await api.postMatches({
      matchValues,
      matchMaps,
      matchTeams: null,
      matchDraft: null,
      servers: null,
    });

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

    const { data: servers } = await createMatchServers(match.id, serverSelect);

    // TODO: consider handling in webhook
    if (match.config.guild && isScheduledMatch(match)) {
      const { data: event, error: discordError } = await postGuildScheduledEvent(
        match.config.guild,
        createScheduledMatchEvent(
          match,
          servers?.map(({ server }) => server)
        )
      );

      if (event) {
        const cookieStore = await cookies();
        await supabase(cookieStore).updateMatch(match.id, { events: [event.id] });
      } else {
        logErrorMessage('Failed to post scheduled event to discord', discordError, {
          match,
        });
      }

      logMessage(`Match ${result.data.id} scheduled by ${player?.nick}`, {
        match: result.data,
        player,
        scheduledInput,
        timezone,
        event,
        mapsSelect: mapSelect,
      });
    }
    revalidatePath('/matches');
    return result;
  } catch (e) {
    return { data: null, error: toFetchError(e) };
  }
}

export async function createMatchServers(matchId: number, servers: string[]) {
  const cookieStore = await cookies();
  const res = await supabase(cookieStore).createMatchServers(
    matchId,
    ...servers.map((server) => ({ server }))
  );
  if (res.error) {
    logErrorMessage('Failed to set servers', res.error, {
      matchId,
      servers,
    });
  }
  return res;
}
