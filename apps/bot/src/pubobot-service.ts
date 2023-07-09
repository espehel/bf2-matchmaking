import { DiscordConfig, User } from '@bf2-matchmaking/types';
import { Embed, User as DiscordUser, UserManager } from 'discord.js';
import { api } from '@bf2-matchmaking/utils';

export const createMatch = async (
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
