'use server';
import { getChannelMessage } from '@bf2-matchmaking/discord';
import { getArray, getValues } from '@bf2-matchmaking/utils/src/form-data';
import { MatchDraftsInsert, MatchesInsert, MatchStatus } from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';
import { api } from '@bf2-matchmaking/services/api';
import { ActionResult } from '@/lib/types/form';

function getConfigByChannel(channelId: string) {
  return 12;
}

export async function scheduleDiscordMatch(formData: FormData): Promise<ActionResult> {
  const { channelId, messageId, scheduledInput, timezone } = getValues(
    formData,
    'channelId',
    'messageId',
    'scheduledInput',
    'timezone'
  );
  const serverSelect = getArray(formData, 'serverSelect');
  const mapSelect = getArray(formData, 'mapSelect');
  const scheduled_at = DateTime.fromISO(scheduledInput, { zone: timezone })
    .toUTC()
    .toISO();

  const matchValues: MatchesInsert = {
    config: getConfigByChannel(channelId),
    status: MatchStatus.Scheduled,
    scheduled_at,
    home_team: 1,
    away_team: 2,
  };
  const matchMaps = mapSelect.map(Number);
  const matchDraft: MatchDraftsInsert = {
    teams_draft: 'captain',
    maps_draft: null,
    sign_up_message: messageId,
    sign_up_channel: channelId,
    summoning_channel: null,
  };

  const result = await api.postMatches({
    matchValues,
    matchMaps,
    matchTeams: null,
    matchDraft,
    servers: serverSelect,
  });
  if (result.data) {
    return {
      success: 'Match scheduled',
      ok: true,
      redirect: `/matches/${result.data.id}`,
      error: null,
    };
  }
  return { success: null, ok: false, error: 'Failed to schedule match' };
}

export async function getDiscordMessage(channelId: string, messageId: string) {
  return getChannelMessage(channelId, messageId);
}
