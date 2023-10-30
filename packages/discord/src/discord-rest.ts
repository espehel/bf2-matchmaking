import { RequestData, REST } from '@discordjs/rest';
import {
  Routes,
  APIGuildMember,
  RESTPostAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessageResult,
  APIApplicationCommand,
  RESTGetAPIChannelMessagesResult,
  RESTPatchAPIChannelMessageJSONBody,
  RESTPatchAPIChannelMessageResult,
  RESTPostAPICurrentUserCreateDMChannelResult,
  RESTPutAPIChannelMessageReactionResult,
  RESTDeleteAPIChannelAllMessageReactionsResult,
  RESTGetAPIChannelMessageResult,
  RESTPostAPIGuildScheduledEventJSONBody,
  RESTPostAPIGuildScheduledEventResult,
  RESTPatchAPIGuildScheduledEventJSONBody,
  RESTPatchAPIGuildScheduledEventResult,
  RESTDeleteAPIGuildScheduledEventResult,
} from 'discord-api-types/v10';
import invariant from 'tiny-invariant';
import {
  error,
  logCreateChannelMessage,
  logEditChannelMessage,
} from '@bf2-matchmaking/logging';
import { RESTDeleteAPIChannelMessageResult } from 'discord-api-types/rest/v10/channel';

invariant(process.env.DISCORD_TOKEN, 'process.env.DISCORD_TOKEN not defined');
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

export interface SuccessResponse<T> {
  data: T;
  error: null;
}
export interface ErrorResponse {
  data: null;
  error: unknown;
}

export type DiscordRestResponse<T> = SuccessResponse<T> | ErrorResponse;
const postDiscordRoute = async <T>(
  route: `/${string}`,
  options?: RequestData
): Promise<DiscordRestResponse<T>> => {
  try {
    const data = (await rest.post(route, options)) as T;
    return { data, error: null };
  } catch (e) {
    error(`POST ${route}`, e);
    return { data: null, error: e };
  }
};

const putDiscordRoute = async <T>(
  route: `/${string}`,
  options?: RequestData
): Promise<DiscordRestResponse<T>> => {
  try {
    const data = (await rest.put(route, options)) as T;
    return { data, error: null };
  } catch (e) {
    error(`PUT ${route}`, e);
    return { data: null, error: e };
  }
};

const getDiscordRoute = async <T>(
  route: `/${string}`,
  options?: RequestData
): Promise<DiscordRestResponse<T>> => {
  try {
    const data = (await rest.get(route, options)) as T;
    return { data, error: null };
  } catch (e) {
    error(`GET ${route}`, e);
    return { data: null, error: e };
  }
};

const deleteDiscordRoute = async <T>(
  route: `/${string}`,
  options?: RequestData
): Promise<DiscordRestResponse<T>> => {
  try {
    const data = (await rest.delete(route, options)) as T;
    return { data, error: null };
  } catch (e) {
    error(`DELETE ${route}`, e);
    return { data: null, error: e };
  }
};

const patchDiscordRoute = async <T>(
  route: `/${string}`,
  options?: RequestData
): Promise<DiscordRestResponse<T>> => {
  try {
    const data = (await rest.patch(route, options)) as T;
    return { data, error: null };
  } catch (e) {
    error(`PATCH ${route}`, e);
    return { data: null, error: e };
  }
};

export const getChannelMessages = (channelId: string) =>
  getDiscordRoute<RESTGetAPIChannelMessagesResult>(
    `${Routes.channelMessages(channelId)}?limit=50`
  );

export const getChannelMessage = (channelId: string, messageId: string) =>
  getDiscordRoute<RESTGetAPIChannelMessageResult>(
    `${Routes.channelMessage(channelId, messageId)}`
  );

export const sendChannelMessage = async (
  channelId: string,
  body: RESTPostAPIChannelMessageJSONBody
) => {
  const res = await postDiscordRoute<RESTPostAPIChannelMessageResult>(
    Routes.channelMessages(channelId),
    {
      body,
    }
  );
  logCreateChannelMessage(channelId, res.data?.id, body.content, body.embeds);
  return res;
};

export const sendDirectMessage = async (
  playerId: string,
  body: RESTPostAPIChannelMessageJSONBody
) => {
  const { data: dmChannel, error } =
    await postDiscordRoute<RESTPostAPICurrentUserCreateDMChannelResult>(
      Routes.userChannels(),
      {
        body: { recipient_id: playerId },
      }
    );
  if (dmChannel) {
    return sendChannelMessage(dmChannel.id, body);
  }
  return { error } as ErrorResponse;
};

export const editChannelMessage = async (
  channelId: string,
  messageId: string,
  body: RESTPatchAPIChannelMessageJSONBody
) => {
  const res = await patchDiscordRoute<RESTPatchAPIChannelMessageResult>(
    Routes.channelMessage(channelId, messageId),
    { body }
  );
  logEditChannelMessage(channelId, messageId, body.content, body.embeds);
  return res;
};

export const removeChannelMessage = (channelId: string, messageId: string) =>
  deleteDiscordRoute<RESTDeleteAPIChannelMessageResult>(
    Routes.channelMessage(channelId, messageId)
  );

export const createMessageReaction = (
  channelId: string,
  messageId: string,
  emoji: string
) =>
  putDiscordRoute<RESTPutAPIChannelMessageReactionResult>(
    Routes.channelMessageOwnReaction(channelId, messageId, emoji)
  );

export const deleteAllReactions = (channelId: string, messageId: string) =>
  deleteDiscordRoute<RESTDeleteAPIChannelAllMessageReactionsResult>(
    Routes.channelMessageAllReactions(channelId, messageId)
  );

export const postCommand = (appId: string, command: Partial<APIApplicationCommand>) =>
  postDiscordRoute<APIApplicationCommand>(Routes.applicationCommands(appId), {
    body: command,
  });

export const deleteCommand = (appId: string, commandId: string) =>
  deleteDiscordRoute<APIApplicationCommand>(Routes.applicationCommand(appId, commandId));

export const getCommands = (appId: string) =>
  getDiscordRoute<Array<APIApplicationCommand>>(Routes.applicationCommands(appId));

export const postGuildCommand = (
  appId: string,
  guildId: string,
  command: Partial<APIApplicationCommand>
) =>
  postDiscordRoute<APIApplicationCommand>(
    Routes.applicationGuildCommands(appId, guildId),
    { body: command }
  );

export const deleteGuildCommand = (appId: string, guildId: string, commandId: string) =>
  deleteDiscordRoute<APIApplicationCommand>(
    Routes.applicationGuildCommand(appId, guildId, commandId)
  );

export const getGuildCommands = (appId: string, guildId: string) =>
  getDiscordRoute<Array<APIApplicationCommand>>(
    Routes.applicationGuildCommands(appId, guildId)
  );

export const postGuildScheduledEvent = (
  guildId: string,
  body: RESTPostAPIGuildScheduledEventJSONBody
) =>
  postDiscordRoute<RESTPostAPIGuildScheduledEventResult>(
    Routes.guildScheduledEvents(guildId),
    { body }
  );

export const patchGuildScheduledEvent = (
  guildId: string,
  scheduledEventId: string,
  body: RESTPatchAPIGuildScheduledEventJSONBody
) =>
  patchDiscordRoute<RESTPatchAPIGuildScheduledEventResult>(
    Routes.guildScheduledEvent(guildId, scheduledEventId),
    { body }
  );

export const deleteGuildScheduledEvent = (guildId: string, scheduledEventId: string) =>
  deleteDiscordRoute<RESTDeleteAPIGuildScheduledEventResult>(
    Routes.guildScheduledEvent(guildId, scheduledEventId)
  );
