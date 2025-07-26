'use server';
import { getChannelMessage } from '@bf2-matchmaking/discord';
import { getArray, getValues } from '@bf2-matchmaking/utils/src/form-data';
import { MatchDraftsInsert, MatchStatus } from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';
import { ActionResult } from '@/lib/types/form';
import { matchApi } from '@/lib/match';
import { parseError } from '@bf2-matchmaking/services/error';

function getConfigByChannel(channelId: string) {
  return 28;
}

export async function scheduleDiscordMatch(formData: FormData): Promise<ActionResult> {
  try {
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

    const match = await matchApi.create({
      config: getConfigByChannel(channelId),
      status: MatchStatus.Scheduled,
      scheduled_at,
      home_team: 1,
      away_team: 2,
    });

    const matchMaps = mapSelect.map(Number);
    const matchDraft: MatchDraftsInsert = {
      teams_draft: 'captain',
      maps_draft: null,
      sign_up_message: messageId,
      sign_up_channel: channelId,
      summoning_channel: null,
    };
    await matchApi
      .update(match.id)
      .setMaps(matchMaps)
      .setDraft(matchDraft)
      .setServers(serverSelect)
      .commit();

    return {
      success: 'Match scheduled',
      ok: true,
      redirect: `/matches/${match.id}`,
      error: null,
    };
  } catch (e) {
    return {
      success: null,
      ok: false,
      error: `Failed to schedule match (${parseError(e)})`,
    };
  }
}

export async function getDiscordMessage(channelId: string, messageId: string) {
  return getChannelMessage(channelId, messageId);
}
