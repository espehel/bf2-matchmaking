import { Message, MessageReaction } from 'discord.js';
import { findMatchId } from './utils';
import { client } from '@bf2-matchmaking/supabase';

const checkMarkfilter = (reaction: MessageReaction) => reaction.emoji.name === '✅';
export const startReactionListener = (message: Message) => {
  const matchId = findMatchId(message);
  if (!matchId) {
    return;
  }

  const listener = message.createReactionCollector({ filter: checkMarkfilter });
  listener.on('collect', async (reaction, user) => {
    await client().updateMatchPlayer(matchId, user.id, { ready: true });
  });
};
