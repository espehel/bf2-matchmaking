import { Message, MessageReaction, User } from 'discord.js';
import { findMatchId } from './utils';
import { client } from '@bf2-matchmaking/supabase';
import { error, info } from '@bf2-matchmaking/logging';
import {
  DiscordMatch,
  MatchReaction,
  ServerReaction,
  ServersRow,
} from '@bf2-matchmaking/types';
import { getPlayerTeam } from '@bf2-matchmaking/utils';

const LISTENER_RUNTIME = 600000; // 10 min

const isMatchReaction = (reaction: MessageReaction) =>
  Object.values(MatchReaction).some((mr) => mr === reaction.emoji.name);
const isServerReaction = (reaction: MessageReaction) =>
  reaction.emoji.name === ServerReaction.ACCEPT;
export const listenForMatchMessageReaction = (message: Message) => {
  const matchId = findMatchId(message);
  if (!matchId) {
    return;
  }
  info('listenForMatchMessageReaction', `Creating listener for match ${matchId}`);
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
      'listenForMatchMessageReaction',
      `Stopped listening to match ${matchId}, after collecting ${collected.size} reactions, because ${reason}.`
    );
  });
};

export const listenForServerMessageReaction = (
  message: Message,
  server: ServersRow,
  match: DiscordMatch,
  team: string
) => {
  info(
    'listenForServerMessageReaction',
    `Creating listener for proposed server ${server.name}`
  );
  const listener = message.createReactionCollector({
    filter: isServerReaction,
    time: LISTENER_RUNTIME,
  });

  listener.on('collect', async (reaction, user) => {
    const playerTeam = getPlayerTeam(user.id, match);
    info(
      'listenForServerMessageReaction',
      `Received reaction from ${user.id} in team ${playerTeam?.toLocaleUpperCase()}`
    );
    if (playerTeam && playerTeam !== team) {
      await client().updateMatch(match.id, { server: server.ip });
    }
  });

  listener.on('end', (collected, reason) => {
    info(
      'listenForServerMessageReaction',
      `Stopped listening to proposed server ${server.name}, after collecting ${collected.size} reactions, because ${reason}.`
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
