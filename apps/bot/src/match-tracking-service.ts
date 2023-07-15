import { DiscordConfig, MatchesJoined, User } from '@bf2-matchmaking/types';
import { Embed, TextChannel, User as DiscordUser, UserManager } from 'discord.js';
import { api } from '@bf2-matchmaking/utils';
import { getServerEmbed, getServerPollEmbed } from '@bf2-matchmaking/discord';
import { getServerTupleList } from './server-interactions';
import { compareMessageReactionCount } from './utils';
import moment from 'moment';
import { client } from '@bf2-matchmaking/supabase';

export const createMatchFromPubobotEmbed = async (
  embed: Embed,
  users: UserManager,
  config: DiscordConfig
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
  return api.rcon().postMatch({ team1, team2, config: config.id });
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
  match: MatchesJoined,
  config: DiscordConfig,
  channel: TextChannel
) => {
  const servers = await getServerTupleList();

  const pollEndTime = moment().add(1, 'minute');
  const message = await channel.send({
    embeds: [getServerPollEmbed(match, servers, pollEndTime)],
  });
  await Promise.all(servers.map(([, , emoji]) => message.react(emoji)));

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

    await Promise.all([
      client().updateMatch(match.id, {
        server: selectedServer.ip,
      }),
      message.reactions.removeAll(),
      message.edit({ embeds: [getServerEmbed(match, selectedServer)] }),
    ]);
  }, pollEndTime.diff(moment()));
};
