import { DiscordConfig, RconBf2Server, User } from '@bf2-matchmaking/types';
import {
  Embed,
  MessageReaction,
  TextChannel,
  User as DiscordUser,
  UserManager,
} from 'discord.js';
import { api } from '@bf2-matchmaking/utils';
import { getServerEmbed, getServerPollEmbed } from '@bf2-matchmaking/discord';
import { getServerStatus, getServerTupleList } from './server-interactions';
import { compareMessageReactionCount } from './utils';
import moment from 'moment';
import { logCreateChannelMessage, logEditChannelMessage } from '@bf2-matchmaking/logging';

export const createMatchFromPubobotEmbed = async (
  embed: Embed,
  users: UserManager,
  configId: number,
  serverIp: string
) => {
  const team1 = (
    await Promise.all(
      getUserIds(embed, 'USMC')?.map((player) => users.fetch(player)) || []
    )
  ).map(toPlayer);
  const team2 = (
    await Promise.all(
      getUserIds(embed, 'MEC')?.map((player) => users.fetch(player)) || []
    )
  ).map(toPlayer);
  return api.rcon().postMatch({ team1, team2, config: configId, serverIp });
};

const getUserIds = (embed: Embed, name: string) =>
  embed.fields
    ?.find((field) => field.name.includes(name))
    ?.value.match(/(?<=<@)\d+(?=>)/g);

const toPlayer = ({ id, avatar, username, discriminator }: DiscordUser): User => ({
  id,
  avatar: avatar || '',
  username,
  discriminator,
});

export const sendServerPollMessage = async (
  config: DiscordConfig,
  channel: TextChannel,
  onServerChosen: (server: RconBf2Server) => void
) => {
  const servers = await getServerTupleList();

  const pollEndTime = moment().add(1, 'minute');
  const message = await channel.send({
    embeds: [getServerPollEmbed(servers, pollEndTime)],
  });
  await Promise.all(servers.map(([, , emoji]) => message.react(emoji)));
  logCreateChannelMessage(
    channel.id,
    message.id,
    message.embeds[0].description,
    message.embeds[0]
  );

  setTimeout(async () => {
    const topEmoji = message.reactions.cache.sort(compareMessageReactionCount).at(0);

    const { server, error } = getTopServer(servers, topEmoji);

    if (!server) {
      return await channel.send(error);
    }

    const [, editedMessage] = await Promise.all([
      message.reactions.removeAll(),
      message.edit({ embeds: [getServerEmbed(server)] }),
    ]);
    logEditChannelMessage(
      channel.id,
      editedMessage.id,
      editedMessage.embeds[0].description,
      editedMessage.embeds[0]
    );
    onServerChosen(server);
  }, pollEndTime.diff(moment()));
};

// TODO: Automatically returns frankfurt server if available and no votes, to get some data going
const PBASE_FRANKFURT = '95.179.167.83';
function getTopServer(
  servers: Array<[RconBf2Server, string, string]>,
  topEmoji: MessageReaction | undefined
) {
  if (!topEmoji || topEmoji.count < 2) {
    const frankFurtServer = servers.find(([server]) => server.ip === PBASE_FRANKFURT);
    if (frankFurtServer && getServerStatus(frankFurtServer[0]) === 'available') {
      return { error: null, server: frankFurtServer[0] };
    }
    return { error: 'No votes received.', server: null };
  }

  const topServer = servers.find(([, , emoji]) => topEmoji.emoji.name === emoji);
  if (!topServer) {
    return { error: 'Failed to add match server', server: null };
  }
  return { server: topServer[0], error: null };
}
