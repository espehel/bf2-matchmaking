import { DiscordConfig, MatchStatus, PubobotMatch } from '@bf2-matchmaking/types';
import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import {
  isPubobotMatchCheckIn,
  isPubobotMatchDrafting,
  isPubobotMatchStarted,
} from './discord-utils';
import { Message, MessageCollector } from 'discord.js';
import {
  createPubobotMatch,
  draftPubobotMatch,
  getPubobotId,
  startPubobotMatch,
} from './services/pubobot-service';
import { pubobotHash } from '@bf2-matchmaking/redis/pubobot';

export function addMatchListener(collector: MessageCollector, config: DiscordConfig) {
  collector.filter = matchFilter;
  collector.on('collect', handleMatchCollect);
  collector.on('end', (collected, reason) => {
    info(
      'addMatchListener',
      `Stopped listening to ${config.name}, after collecting ${collected.size} messages, because ${reason}.`
    );
  });
  info('addMatchListener', `Listening to ${config.name}`);
}

export function matchFilter(message: Message) {
  const pubobotId = getPubobotId(message);
  if (!pubobotId) {
    return false;
  }
  return isPubobotMatchCheckIn(message) || isPubobotMatchStarted(message);
}

export function addDraftListener(collector: MessageCollector) {
  collector.filter = draftFilter;
  collector.on('collect', handleDraftCollect);
  collector.on('end', (collected, reason) => {
    info(
      'addDraftListener',
      `Stopped listening to debug channel, after collecting ${collected.size} messages, because ${reason}.`
    );
  });
  info('addDraftListener', `Listening to debug channel`);
}

export function draftFilter(message: Message) {
  const pubobotId = getPubobotId(message);
  if (!pubobotId) {
    return false;
  }
  return isPubobotMatchDrafting(message);
}

async function handleMatchCollect(message: Message) {
  if (!message.inGuild()) {
    return;
  }
  const pubobotId = getPubobotId(message);
  if (!pubobotId) {
    return;
  }
  info(
    'handleMatchCollect',
    `<${message.channel.name}>: Received embed with title "${message.embeds[0]?.title}"`
  );
  try {
    let matchId = await pubobotHash.getSafe(pubobotId);

    if (!matchId) {
      matchId = await createPubobotMatch(message, pubobotId);
      logMessage(`Match ${matchId}: Created from pubobotid ${pubobotId}`, {
        embed: message.embeds[0],
      });
    }

    if (!isPubobotMatchStarted(message)) {
      return;
    }

    await startPubobotMatch(message, matchId);
  } catch (e) {
    logErrorMessage(
      `PubobotMatch ${pubobotId} failed to handle embed "${message.embeds[0]?.title}"`,
      e
    );
  }
}

async function handleDraftCollect(message: Message) {
  if (!message.inGuild()) {
    return;
  }
  const pubobotId = getPubobotId(message);
  if (!pubobotId) {
    return;
  }
  const matchId = await pubobotHash.getSafe(pubobotId);

  if (!matchId) {
    info('handleDraftCollect', 'pubobot matchId not found');
    return;
  }

  info(
    'handleDraftCollect',
    `<${message.channel.name}>: Received embed with title "${message.embeds[0]?.title}"`
  );
  try {
    await draftPubobotMatch(message, pubobotId, Number(matchId));
  } catch (e) {
    logErrorMessage(
      `PubobotMatch ${pubobotId} failed to handle embed "${message.embeds[0]?.title}"`,
      e
    );
  }
}
