import {
  Message,
  MessageCreateOptions,
  MessageEditOptions,
  MessagePayload,
  TextBasedChannel,
  TextChannel,
} from 'discord.js';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import {
  createServerLocationPollResultField,
  DEBUG_CHANNEL_ID,
  DEMO_CHANNEL_ID,
  getMatchField,
  getMatchServerField,
  getServerFields,
  logChannelMessage,
  LOG_CHANNEL_ID,
} from '@bf2-matchmaking/discord';
import { isTextBasedChannel } from '../discord-utils';
import {
  LocationEmoji,
  PollResult,
  MatchesJoined,
  LogContext,
  isConnectedLiveServer,
} from '@bf2-matchmaking/types';
import { api, isBetaTester } from '@bf2-matchmaking/utils';
import { getKey } from '@bf2-matchmaking/utils';
import { discordClient } from '../client';

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
    logErrorMessage('Failed to send message', e, {
      channel: channel.name,
      id: channel.id,
      content,
      ...context,
    });
    return null;
  }
}

export async function editMessage(
  message: Message<true>,
  content: string | MessagePayload | MessageEditOptions,
  context?: LogContext
) {
  try {
    const result = await message.edit(content);
    logChannelMessage(result, {
      content,
      name: message.channel.name,
      id: message.channel.id,
      ...context,
    });
    return result;
  } catch (e) {
    logErrorMessage('Failed to edit message', e, {
      name: message.channel.name,
      id: message.channel.id,
      content,
      ...context,
    });
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
  const messages = await Promise.all(
    match.players.filter(isBetaTester).map(async (player) => {
      const message = await discordClient.users.send(
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
    const connectedServers = servers?.filter(isConnectedLiveServer);
    if (connectedServers?.length) {
      await message.edit({
        embeds: [
          { fields: [...getServerFields(connectedServers), getMatchField(match)] },
        ],
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
  if (!isTextBasedChannel(channel)) {
    throw new Error(`Can't send message to channel ${channel.id}`);
  }
  const { data: servers } = await api.live().getServers();
  const connectedServers = servers?.filter(isConnectedLiveServer);

  if (!connectedServers?.length) {
    return;
  }
  const serversMessage = await channel.send({
    embeds: [
      {
        fields: [
          ...getServerFields(connectedServers),
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

export async function getLogChannel() {
  const channel = await discordClient.channels.fetch(LOG_CHANNEL_ID);
  if (!isTextBasedChannel(channel)) {
    throw new Error('Test channel not found');
  }
  return channel;
}

export async function sendLogMessage(
  content: string | MessagePayload | MessageCreateOptions
) {
  try {
    const channel = await getLogChannel();
    return channel.send(content);
  } catch (e) {
    logErrorMessage('Failed to send debug message', e, { content });
    return null;
  }
}

export async function getDemoChannel() {
  const channel = await discordClient.channels.fetch(DEMO_CHANNEL_ID);
  if (!isTextBasedChannel(channel)) {
    throw new Error('Failed to fetch demo channel');
  }
  return channel;
}

export async function getDebugChannel() {
  const channel = await discordClient.channels.fetch(DEBUG_CHANNEL_ID);
  if (!isTextBasedChannel(channel)) {
    throw new Error('Failed to fetch debug channel');
  }
  return channel;
}

export async function sendDebugMessage(
  content: string | MessagePayload | MessageCreateOptions
) {
  try {
    const channel = await getDebugChannel();
    return channel.send(content);
  } catch (e) {
    logErrorMessage('Failed to send debug message', e, { content });
    return null;
  }
}
