import { Message } from 'discord.js';
import { findMatchId } from './utils';
import { client } from '@bf2-matchmaking/supabase';

export const startReactionListener = (message: Message) => {
  const matchId = findMatchId(message);
  if (!matchId) {
    return;
  }

  const listener = message.createReactionCollector();
  listener.on('collect', async (reaction, user) => {
    await client().updateMatchPlayer(matchId, user.id, { ready: true });
  });
};
