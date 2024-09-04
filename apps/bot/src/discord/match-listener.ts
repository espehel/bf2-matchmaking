import { DiscordConfig, MatchStatus, PubobotMatch } from '@bf2-matchmaking/types';
import { info, logErrorMessage } from '@bf2-matchmaking/logging';
import {
  isPubobotMatchCheckIn,
  isPubobotMatchDrafting,
  isPubobotMatchStarted,
} from './discord-utils';
import { Message, MessageCollector } from 'discord.js';
import {
  createPubobotMatch,
  draftPubobotMatch,
  findPubobotMatch,
  getPubobotId,
  startPubobotMatch,
} from '../services/pubobot-service';
import { hash } from '@bf2-matchmaking/redis/src/hash';

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
    let pubobotMatch = await findPubobotMatch(pubobotId);

    if (!pubobotMatch && isPubobotMatchCheckIn(message)) {
      await createPubobotMatch(message, pubobotId);
      return;
    }

    if (!isPubobotMatchStarted(message)) {
      return;
    }

    if (!pubobotMatch) {
      pubobotMatch = await createPubobotMatch(message, pubobotId);
    }

    if (pubobotMatch.status === MatchStatus.Ongoing) {
      return;
    }

    await hash<PubobotMatch>(`pubobot:${pubobotId}`).set({
      status: MatchStatus.Ongoing,
    });

    await startPubobotMatch(message, pubobotMatch);

    await hash(`pubobot:${pubobotId}`).del();
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
  const pubobotMatch = await findPubobotMatch(pubobotId);

  if (!pubobotMatch) {
    info('handleDraftCollect', 'pubobotMatch match not found');
    return;
  }
  if (pubobotMatch.status !== MatchStatus.Open) {
    return;
  }

  info(
    'handleDraftCollect',
    `<${message.channel.name}>: Received embed with title "${message.embeds[0]?.title}"`
  );
  try {
    await hash<PubobotMatch>(`pubobot:${pubobotId}`).set({
      status: MatchStatus.Drafting,
    });
    await draftPubobotMatch(message, pubobotMatch);
  } catch (e) {
    logErrorMessage(
      `PubobotMatch ${pubobotId} failed to handle embed "${message.embeds[0]?.title}"`,
      e
    );
  }
}
