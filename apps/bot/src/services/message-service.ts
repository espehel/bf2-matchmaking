import { Message, MessageCreateOptions, MessageReaction } from 'discord.js';
import {
  info,
  logCreateChannelMessage,
  logErrorMessage,
  logMessage,
} from '@bf2-matchmaking/logging';
import { getDiscordClient } from '../discord/client';
import {
  createServerLocationPollResultField,
  DEMO_CHANNEL_ID,
  getMatchField,
  getMatchServerField,
  getServerFields,
  getTeamDraftEmbed,
  TEST_CHANNEL_ID,
} from '@bf2-matchmaking/discord';
import { isTextBasedChannel } from '../discord/utils';
import { LocationEmoji, LocationPollResult, MatchesJoined } from '@bf2-matchmaking/types';
import { api, isBetaTester } from '@bf2-matchmaking/utils';
import { draftTeams, getAverageRating } from './draft-utils';
import { getKey } from '@bf2-matchmaking/utils/src/object-utils';

export async function sendSummoningMessage(match: MatchesJoined) {
  const client = await getDiscordClient();
  const messages = await Promise.all(
    match.players.filter(isBetaTester).map(async (player) => {
      const message = await client.users.send(
        player.id,
        `Match ${match.id} is summoning. Go to ${api
          .web()
          .matchPage(match.id, player.id)} to check in.`
      );
      return { message: message.id, player: player.nick };
    })
  );
  logMessage(`Match ${match.id} sent summoning message to ${messages.length} players`, {
    players: match.players,
    messages: messages,
  });
}
export async function sendDraftMessage(match: MatchesJoined) {
  const { snakeDraftTeams, teams, actualTeams } = draftTeams(match);
  const testChannel = await getTestChannel();
  await testChannel.send({
    content: `Match: ${match.id}, rating: ${getAverageRating(match.teams)}`,
    embeds: [
      getTeamDraftEmbed('Snake Draft', snakeDraftTeams),
      getTeamDraftEmbed('BF2.gg Draft', teams),
      getTeamDraftEmbed('Actual Draft', actualTeams),
    ],
  });
}
export async function replyMessage(message: Message, content: MessageCreateOptions) {
  if (!isTextBasedChannel(message.channel)) {
    info('replyMessage', 'Message did not come from text based channel');
    return null;
  }
  try {
    const replyMessage = await message.channel.send(content);
    logCreateChannelMessage(
      message.channel.id,
      replyMessage.id,
      replyMessage.embeds[0].description,
      replyMessage.embeds
    );
    return replyMessage;
  } catch (e) {
    logErrorMessage('Failed to reply to message', e, { message, content });
    return null;
  }
}

export async function editLocationPollMessageWithResults(
  message: Message,
  match: MatchesJoined,
  results: Array<LocationPollResult>
) {
  const locationName = getKey(LocationEmoji, results[0][0]);

  if (results[0][0] === LocationEmoji.Existing) {
    const { data: servers } = await api.live().getServers();
    if (servers?.length) {
      await message.edit({
        embeds: [{ fields: [...getServerFields(servers), getMatchField(match)] }],
      });
    }
  } else if (locationName) {
    await message.edit({
      embeds: [
        {
          fields: [
            createServerLocationPollResultField(locationName),
            getMatchField(match),
          ],
        },
      ],
    });
  }
  logMessage(
    `Channel ${message.channel.id}: Poll updated with result for Match ${match.id}`,
    {
      match,
      locationName,
      results,
    }
  );
}

export async function sendServersMessage(message: Message<true>, match: MatchesJoined) {
  const { data: servers } = await api.live().getServers();
  if (servers?.length) {
    await message.edit({
      embeds: [
        {
          fields: [
            ...getServerFields(servers),
            getMatchServerField(match),
            getMatchField(match),
          ],
        },
      ],
    });
  }
}

export async function getTestChannel() {
  const client = await getDiscordClient();
  const channel = await client.channels.fetch(TEST_CHANNEL_ID);
  if (!isTextBasedChannel(channel)) {
    throw new Error('Test channel not found');
  }
  return channel;
}

export async function getDemoChannel() {
  const client = await getDiscordClient();
  const channel = await client.channels.fetch(DEMO_CHANNEL_ID);
  if (!isTextBasedChannel(channel)) {
    throw new Error('Failed to fetch demo channel');
  }
  return channel;
}
