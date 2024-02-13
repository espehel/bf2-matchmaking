import {
  Message,
  MessageCreateOptions,
  MessagePayload,
  TextBasedChannel,
  TextChannel,
} from 'discord.js';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { getDiscordClient } from '../discord/client';
import {
  createServerLocationPollResultField,
  DEBUG_CHANNEL_ID,
  DEMO_CHANNEL_ID,
  getMatchField,
  getMatchServerField,
  getServerFields,
  logChannelMessage,
  TEST_CHANNEL_ID,
} from '@bf2-matchmaking/discord';
import { isTextBasedChannel } from '../discord/discord-utils';
import {
  LocationEmoji,
  PollResult,
  MatchesJoined,
  LogContext,
} from '@bf2-matchmaking/types';
import { api, isBetaTester } from '@bf2-matchmaking/utils';
import { getKey } from '@bf2-matchmaking/utils/src/object-utils';

export async function sendMessage(
  channel: TextChannel,
  content: string | MessagePayload | MessageCreateOptions,
  context?: LogContext
) {
  try {
    const result = await channel.send(content);
    logChannelMessage(result, {
      content,
      name: channel.name,
      id: channel.id,
      ...context,
    });
    return result;
  } catch (e) {
    logErrorMessage('Failed to send message', e, { channel, content, ...context });
    return null;
  }
}

export async function replyMessage(
  message: Message,
  content: string | MessagePayload | MessageCreateOptions
) {
  if (!isTextBasedChannel(message.channel)) {
    logErrorMessage(
      'Failed to reply to message',
      'Message did not come from text based channel',
      { message, content }
    );
    return null;
  }
  return sendMessage(message.channel, content);
}
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

export async function editLocationPollMessageWithResults(
  message: Message,
  match: MatchesJoined,
  results: Array<PollResult>
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

export async function sendServersMessage(
  match: MatchesJoined,
  channel: TextBasedChannel
) {
  const { data: servers } = await api.live().getServers();
  if (!servers?.length) {
    return;
  }
  const serversMessage = await channel.send({
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
  logMessage(
    `Channel ${serversMessage.channelId}: Sent server list for Match ${match.id}`,
    {
      match,
      servers,
    }
  );
  return serversMessage;
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

export async function getDebugChannel() {
  const client = await getDiscordClient();
  const channel = await client.channels.fetch(DEBUG_CHANNEL_ID);
  if (!isTextBasedChannel(channel)) {
    throw new Error('Failed to fetch debug channel');
  }
  return channel;
}
