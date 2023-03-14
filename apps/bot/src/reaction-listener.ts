import { Message, MessageReaction } from 'discord.js';
import { findMatchId } from './utils';
import { client } from '@bf2-matchmaking/supabase';
import { error, info } from '@bf2-matchmaking/logging';

const checkMarkfilter = (reaction: MessageReaction) => reaction.emoji.name === '✅';
export const startReactionListener = (message: Message) => {
  const matchId = findMatchId(message);
  if (!matchId) {
    return;
  }
  info('startReactionListener', `Creating listener for match ${matchId}`);
  const listener = message.createReactionCollector({ filter: checkMarkfilter });
  listener.on('collect', async (reaction, user) => {
    const { error: err } = await client().updateMatchPlayer(matchId, user.id, {
      ready: true,
    });
    if (err) {
      error('startReactionListener', err);
    } else {
      info('startReactionListener', `${user.username} is ready`);
    }
  });
};
