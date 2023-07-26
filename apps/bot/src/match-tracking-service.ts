import { DiscordConfig, RconBf2Server, User } from '@bf2-matchmaking/types';
import { Embed, TextChannel, User as DiscordUser, UserManager } from 'discord.js';
import { api } from '@bf2-matchmaking/utils';
import { getServerEmbed, getServerPollEmbed } from '@bf2-matchmaking/discord';
import { getServerTupleList } from './server-interactions';
import { compareMessageReactionCount } from './utils';
import moment from 'moment';
import { logCreateChannelMessage, logEditChannelMessage } from '@bf2-matchmaking/logging';

export const createMatchFromPubobotEmbed = async (
  embed: Embed,
  users: UserManager,
  config: DiscordConfig,
  server: RconBf2Server
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
  return api.rcon().postMatch({ team1, team2, config: config.id, serverIp: server.ip });
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
    if (!topEmoji || topEmoji.count < 2) {
      return await channel.send('No votes received.');
    }

    const topServer = servers.find(([, , emoji]) => topEmoji.emoji.name === emoji);
    if (!topServer) {
      return await channel.send('Failed to add match server');
    }
    const [selectedServer] = topServer;

    const [, editedMessage] = await Promise.all([
      message.reactions.removeAll(),
      message.edit({ embeds: [getServerEmbed(selectedServer)] }),
    ]);
    logEditChannelMessage(
      channel.id,
      editedMessage.id,
      editedMessage.embeds[0].description,
      editedMessage.embeds[0]
    );
    onServerChosen(selectedServer);
  }, pollEndTime.diff(moment()));
};
