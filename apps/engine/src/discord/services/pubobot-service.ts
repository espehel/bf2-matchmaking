import { Message } from 'discord.js';
import { replyMessage, sendServersMessage } from './message-service';
import {
  DEBUG_CHANNEL_ID,
  getMatchStartedEmbed,
  getRulesEmbedByConfig,
} from '@bf2-matchmaking/discord';
import { logActualDraft } from '../../services/draft-service';
import { createDraftPoll } from '../message-polls';
import { MatchStatus } from '@bf2-matchmaking/types';
import {
  buildMatchMaps,
  buildMatchPlayersFromDraftingEmbed,
  buildMatchPlayersFromStartingEmbed,
} from './match-service';
import { getConfigCached } from './supabase-service';
import { DateTime } from 'luxon';
import { getTextChannelFromConfig } from '../discord-utils';
import { matchApi } from '../../lib/match';
import { pubobotHash } from '@bf2-matchmaking/redis/pubobot';
import { warn } from '@bf2-matchmaking/logging';

export async function createPubobotMatch(message: Message, id: string): Promise<string> {
  const config = await getConfigCached(message.channelId);
  const match = await matchApi.create({ config: config.id, status: MatchStatus.Open });
  await pubobotHash.set({ [id]: match.id });
  return match.id.toString();
}

export async function startPubobotMatch(message: Message, matchId: string) {
  const matchStatus = await matchApi.getStatus(matchId);
  if (matchStatus === MatchStatus.Ongoing) {
    warn('startPubobotMatch', `Match ${matchId} already ongoing`);
    return;
  }

  if (matchStatus === MatchStatus.Drafting) {
    await matchApi.update(matchId).commit({
      status: MatchStatus.Ongoing,
      started_at: DateTime.now().toISO(),
    });
    return;
  }
  if (matchStatus !== MatchStatus.Open) {
    warn('startPubobotMatch', `Match ${matchId} is not open`);
    return;
  }

  const config = await getConfigCached(message.channelId);
  const [embed] = message.embeds;

  const teams = await buildMatchPlayersFromStartingEmbed(
    embed,
    Number(matchId),
    config.id
  );
  const maps = await buildMatchMaps(embed);

  const updatedMatch = await matchApi
    .update(matchId)
    .setTeams(teams)
    .setMaps(maps)
    .commit({
      status: MatchStatus.Ongoing,
      started_at: DateTime.now().toISO(),
    });

  await replyMessage(message, {
    embeds: [getMatchStartedEmbed(updatedMatch), getRulesEmbedByConfig(config)],
  });
  await sendServersMessage(updatedMatch, message.channel);
  await logActualDraft(updatedMatch);
}

export async function draftPubobotMatch(
  message: Message,
  pubobotId: string,
  matchId: number
) {
  const matchStatus = await matchApi.getStatus(matchId);
  if (matchStatus !== MatchStatus.Open) {
    warn('draftPubobotMatch', `Match ${matchId} is not open`);
    return;
  }

  const [embed] = message.embeds;

  const maps = await buildMatchMaps(embed);
  const teams = await buildMatchPlayersFromDraftingEmbed(embed, matchId);

  const updatedMatch = await matchApi
    .update(matchId)
    .setTeams(teams)
    .setMaps(maps)
    .commit({ status: MatchStatus.Drafting });

  const channel = await getTextChannelFromConfig(updatedMatch.config);

  await createDraftPoll(channel, message, pubobotId, updatedMatch);

  const config4v4Cup = await getConfigCached(DEBUG_CHANNEL_ID);
  if (config4v4Cup) {
    await createDraftPoll(channel, message, pubobotId, updatedMatch, config4v4Cup);
  }
}

export function getPubobotId(message: Message): string | null {
  return message.embeds[0]?.footer?.text?.replace('Match id: ', '') || null;
}
