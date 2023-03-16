import { Message, MessageReaction } from 'discord.js';
import { findMatchId } from './utils';
import { client } from '@bf2-matchmaking/supabase';
import { error, info } from '@bf2-matchmaking/logging';

const LISTENER_RUNTIME = 600000; // 10 min

const isCheckmark = (reaction: MessageReaction) => reaction.emoji.name === '✅';
export const listenForMessageReaction = (message: Message) => {
  const matchId = findMatchId(message);
  if (!matchId) {
    return;
  }
  info('listenForMessageReaction', `Creating listener for match ${matchId}`);
  const listener = message.createReactionCollector({
    filter: isCheckmark,
    time: LISTENER_RUNTIME,
  });
  listener.on('collect', async (reaction, user) => {
    const { error: err } = await client().updateMatchPlayer(matchId, user.id, {
      ready: true,
    });
    if (err) {
      error('listenForMessageReaction', err);
    } else {
      info('listenForMessageReaction', `${user.username} is ready`);
    }
  });

  listener.on('end', (collected, reason) => {
    info(
      'listenForMessageReaction',
      `Stopped listening to match ${matchId}, after collecting ${collected.size} reactions, because ${reason}.`
    );
  });
};
