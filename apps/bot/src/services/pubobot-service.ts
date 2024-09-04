import { Message } from 'discord.js';
import { replyMessage, sendServersMessage } from './message-service';
import { getMatchStartedEmbed, getRulesEmbedByConfig } from '@bf2-matchmaking/discord';
import { logActualDraft } from './draft-service';
import { createDraftPoll } from '../discord/message-polls';
import { client } from '@bf2-matchmaking/supabase';
import { isPubobotMatch, MatchStatus, PubobotMatch } from '@bf2-matchmaking/types';
import {
  buildMatchMaps,
  buildMatchPlayersFromDraftingEmbed,
  buildMatchPlayersFromStartingEmbed,
  createMatch,
  createMatchMaps,
  createMatchTeams,
  updateMatch,
} from './match-service';
import { hash } from '@bf2-matchmaking/redis/src/hash';
import { getConfigCached } from './supabase-service';
import { DateTime } from 'luxon';

export async function createPubobotMatch(
  message: Message,
  id: number
): Promise<PubobotMatch> {
  const config = await getConfigCached(message.channelId);
  const match = await createMatch(config, MatchStatus.Open);
  const pubobotMatch: PubobotMatch = { matchId: match.id, status: MatchStatus.Open };
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
  await createMatchTeams(pubobotMatch.matchId, config.id, teams);
  const maps = await buildMatchMaps(embed);
  await createMatchMaps(pubobotMatch.matchId, maps);

  const updatedMatch = await updateMatch(pubobotMatch.matchId, {
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
  const config = await getConfigCached(message.channelId);
  const [embed] = message.embeds;

  const maps = await buildMatchMaps(embed);
  await createMatchMaps(pubobotMatch.matchId, maps);
  const teams = await buildMatchPlayersFromDraftingEmbed(embed, pubobotMatch.matchId);
  await createMatchTeams(pubobotMatch.matchId, config.id, teams);

  const updatedMatch = await updateMatch(pubobotMatch.matchId, {
    status: MatchStatus.Drafting,
  });

  await createDraftPoll(message, updatedMatch);

  const { data: config4v4Cup } = await client().getMatchConfig(19);
  if (config4v4Cup) {
    await createDraftPoll(message, updatedMatch, config4v4Cup);
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
