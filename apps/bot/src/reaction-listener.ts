import { Message, MessageReaction, User } from 'discord.js';
import { findMatchId } from './utils';
import { client } from '@bf2-matchmaking/supabase';
import { error, info } from '@bf2-matchmaking/logging';
import { MatchReaction } from '@bf2-matchmaking/types';

const LISTENER_RUNTIME = 600000; // 10 min

const isMatchReaction = (reaction: MessageReaction) =>
  Object.values(MatchReaction).some((mr) => mr === reaction.emoji.name);
export const listenForMessageReaction = (message: Message) => {
  const matchId = findMatchId(message);
  if (!matchId) {
    return;
  }
  info('reaction-listener', `Creating listener for match ${matchId}`);
  const listener = message.createReactionCollector({
    filter: isMatchReaction,
    time: LISTENER_RUNTIME,
  });

  listener.on('collect', async (reaction, user) => {
    switch (reaction.emoji.name) {
      case MatchReaction.READY:
        return handlePlayerReady(matchId, user);
      case MatchReaction.CANCEL:
        return handlePlayerCancel(matchId, user);
    }
  });

  listener.on('end', (collected, reason) => {
    info(
      'reaction-listener',
      `Stopped listening to match ${matchId}, after collecting ${collected.size} reactions, because ${reason}.`
    );
  });
};

const handlePlayerReady = async (matchId: number, user: User) => {
  const { error: err } = await client().updateMatchPlayer(matchId, user.id, {
    ready: true,
  });
  if (err) {
    error('reaction-listener', err);
  } else {
    info('reaction-listener', `${user.username} is ready`);
  }
};

const handlePlayerCancel = async (matchId: number, user: User) => {
  const { error: err } = await client().deleteMatchPlayer(matchId, user.id);
  if (err) {
    error('reaction-listener', err);
  } else {
    info('reaction-listener', `${user.username} canceled summoning`);
  }
};
