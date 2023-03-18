import { getDiscordClient } from './client';
import { ApiError, ApiErrorType, DiscordMatch } from '@bf2-matchmaking/types';
import { error, info } from '@bf2-matchmaking/logging';
import { client } from '@bf2-matchmaking/supabase';
import { TextChannel } from 'discord.js';

const matchChannelsMap = new Map<string, DiscordMatch>();

export const addChannel = async (channelId: string, match: DiscordMatch) => {
  const discordClient = await getDiscordClient();
  const channel = await discordClient.channels.fetch(channelId);
  if (!channel || !channel.isVoiceBased()) {
    throw new ApiError(ApiErrorType.NotVoiceChannel);
  }
  if (matchChannelsMap.size === 0) {
    info('member-listener', `Adding voice listener for channel ${channelId}`);
    await addVoiceListener();
  }
  matchChannelsMap.set(channelId, match);
};

export const removeChannel = async (channelId: string) => {
  const discordClient = await getDiscordClient();
  matchChannelsMap.delete(channelId);
  if (matchChannelsMap.size === 0) {
    discordClient.removeAllListeners('voiceStateUpdate');
  }
};
const addVoiceListener = async () => {
  const discordClient = await getDiscordClient();
  discordClient.on('voiceStateUpdate', async (oldState, newState) => {
    const match = newState.channelId && matchChannelsMap.get(newState.channelId);
    const player = match && match.players.find((p) => p.id === newState.member?.id);
    if (newState.member && match && player) {
      const res = await client().updateMatchPlayer(match.id, player.id, { ready: true });
    }
  });
};

export const getVoiceMembers = async (match: DiscordMatch) => {
  const discordClient = await getDiscordClient();
  const guild = (
    (await discordClient.channels.fetch(match.config.channel)) as TextChannel | null
  )?.guild;
  if (!guild) {
    error('getVoiceMembers', `Could not fetch guild for channel ${match.config.channel}`);
    return [];
  }
  info('getVoiceMembers', `Fetched guild ${guild.id}`);

  const members = await guild.members.fetch({ withPresences: true });
  const matchPlayerIds = [...members.filter((m) => m.voice.channelId).values()]
    .map((m) => m.user.id)
    .filter((id) => match.teams.some(({ player_id }) => player_id === id));
  info(
    'getVoiceMembers',
    `Found following members in voice: ${matchPlayerIds.join(', ')}`
  );
  return matchPlayerIds;
};
