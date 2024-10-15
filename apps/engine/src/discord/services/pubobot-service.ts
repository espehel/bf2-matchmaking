import { Message } from 'discord.js';
import { replyMessage, sendServersMessage } from './message-service';
import {
  DEBUG_CHANNEL_ID,
  getMatchStartedEmbed,
  getRulesEmbedByConfig,
} from '@bf2-matchmaking/discord';
import { logActualDraft } from './draft-service';
import { createDraftPoll } from '../message-polls';
import { isPubobotMatch, MatchStatus, PubobotMatch } from '@bf2-matchmaking/types';
import {
  buildMatchMaps,
  buildMatchPlayersFromDraftingEmbed,
  buildMatchPlayersFromStartingEmbed,
} from './match-service';
import { getConfigCached } from './supabase-service';
import { DateTime } from 'luxon';
import { getTextChannelFromConfig } from '../discord-utils';
import { hash } from '@bf2-matchmaking/redis/hash';
import { Match } from '@bf2-matchmaking/services/matches/Match';

export async function createPubobotMatch(
  message: Message,
  id: number
): Promise<PubobotMatch> {
  const config = await getConfigCached(message.channelId);
  const match = await Match.create(config, MatchStatus.Open);
  const pubobotMatch: PubobotMatch = {
    id,
    matchId: match.id,
    status: MatchStatus.Open,
    channelId: message.channelId,
  };
  await hash(`pubobot:${id}`).set(pubobotMatch);
  return pubobotMatch;
}

export async function startPubobotMatch(message: Message, pubobotMatch: PubobotMatch) {
  const config = await getConfigCached(message.channelId);
  const [embed] = message.embeds;

  const teams = await buildMatchPlayersFromStartingEmbed(
    embed,
    pubobotMatch.matchId,
    config.id
  );
  const maps = await buildMatchMaps(embed);

  const updatedMatch = await Match.update(pubobotMatch.matchId)
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

export async function draftPubobotMatch(message: Message, pubobotMatch: PubobotMatch) {
  const [embed] = message.embeds;

  const maps = await buildMatchMaps(embed);
  const teams = await buildMatchPlayersFromDraftingEmbed(embed, pubobotMatch.matchId);

  const updatedMatch = await Match.update(pubobotMatch.matchId)
    .setTeams(teams)
    .setMaps(maps)
    .commit({ status: MatchStatus.Drafting });

  const channel = await getTextChannelFromConfig(updatedMatch.config);

  await createDraftPoll(channel, message, pubobotMatch, updatedMatch);

  const config4v4Cup = await getConfigCached(DEBUG_CHANNEL_ID);
  if (config4v4Cup) {
    await createDraftPoll(channel, message, pubobotMatch, updatedMatch, config4v4Cup);
  }
}

export function getPubobotId(message: Message): number | null {
  return Number(message.embeds[0]?.footer?.text?.replace('Match id: ', '')) || null;
}

export async function findPubobotMatch(id: number): Promise<PubobotMatch | null> {
  const { data } = await hash<PubobotMatch>(`pubobot:${id}`).getAll();
  if (isPubobotMatch(data)) {
    return data;
  }
  return null;
}
