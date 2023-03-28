import { addChannel, getVoiceMembers, removeChannel } from './member-listener';
import { DiscordMatch } from '@bf2-matchmaking/types';
import { client } from '@bf2-matchmaking/supabase';
import { toMatchPlayerId } from './utils';

export const handleMatchSummon = async (match: DiscordMatch) => {
  // TODO: create channel
  /*if (match.channel.staging_channel) {
    await addChannel(match.channel.staging_channel, match);
  }*/
  const members = await getVoiceMembers(match);
  await client().updateMatchPlayersForMatchId(match.id, members.map(toMatchPlayerId), {
    ready: true,
  });
};

export const handleMatchDraft = async (match: DiscordMatch) => {
  // TODO: create channel
  /*if (match.channel.staging_channel) {
    await removeChannel(match.channel.staging_channel);
  }*/
};
