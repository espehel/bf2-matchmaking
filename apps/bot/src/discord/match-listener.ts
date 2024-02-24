import { DiscordConfig, MatchStatus } from '@bf2-matchmaking/types';
import { error, info, logMessage } from '@bf2-matchmaking/logging';
import {
  isPubobotMatchCheckIn,
  isPubobotMatchDrafting,
  isPubobotMatchStarted,
} from './discord-utils';
import { getMatchStartedEmbed, getRulesEmbedByConfig } from '@bf2-matchmaking/discord';
import { Message, MessageCollector } from 'discord.js';
import {
  addMatch,
  getPubobotId,
  getPubobotMatch,
  hasPubotId,
  removeMatch,
} from '../services/PubobotMatchManager';
import { PubobotMatch } from '../services/PubobotMatch';
import {
  replyMessage,
  sendServersMessage,
  sendSummoningMessage,
} from '../services/message-service';
import { assertObj } from '@bf2-matchmaking/utils';
import { createDraftPoll } from './message-polls';
import { buildDraftWithConfig, logActualDraft } from '../services/draft-service';

export function addMatchListener(collector: MessageCollector, config: DiscordConfig) {
  collector.filter = matchFilter;
  collector.on('collect', handleMatchCollect(config));
  collector.on('end', (collected, reason) => {
    info(
      'addMatchListener',
      `Stopped listening to ${config.name}, after collecting ${collected.size} messages, because ${reason}.`
    );
  });
  info('addMatchListener', `Listening to ${config.name}`);
}

export function matchFilter(message: Message) {
  const [embed] = message.embeds;
  const pubobotId = getPubobotId(embed);
  if (!pubobotId) {
    return false;
  }
  if (isPubobotMatchStarted(embed)) {
    info('messageFilter', `Pubobot match ${pubobotId} started`);
    return true;
  }

  return isPubobotMatchCheckIn(embed) && !hasPubotId(pubobotId, MatchStatus.Open);
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
  const [embed] = message.embeds;
  const pubobotId = getPubobotId(embed);
  if (!pubobotId) {
    return false;
  }
  return isPubobotMatchDrafting(embed);
}
function handleMatchCollect(config: DiscordConfig) {
  return async (message: Message) => {
    if (!message.inGuild()) {
      return;
    }

    info(
      'handleMatchCollect',
      `<${message.channel.name}>: Received embed with title "${message.embeds[0]?.title}"`
    );

    if (isPubobotMatchCheckIn(message.embeds[0])) {
      return handlePubobotMatchCheckIn(message);
    }

    if (isPubobotMatchStarted(message.embeds[0])) {
      return handlePubobotMatchStarted(message);
    }
  };

  async function handlePubobotMatchCheckIn(message: Message<true>) {
    try {
      const match = await PubobotMatch.fromCheckInEmbed(config, message);
      addMatch(match);

      if (match?.match) {
        await sendSummoningMessage(match.match);
      }
    } catch (e) {
      error('handlePubobotMatchCheckIn', e);
    }
  }
  async function handlePubobotMatchStarted(message: Message) {
    const embed = message.embeds[0];
    try {
      const pubMatch = getPubobotMatch(embed);
      assertObj(pubMatch, 'No pubobot match found');

      await pubMatch.startMatch(embed);

      await replyMessage(message, {
        embeds: [getMatchStartedEmbed(pubMatch.match), getRulesEmbedByConfig(config)],
      });

      logMessage(`Match ${pubMatch.match.id}: started`, {
        pubMatch,
      });

      await sendServersMessage(pubMatch.match, message.channel);
      await logActualDraft(pubMatch);
    } catch (e) {
      error('handlePubobotMatchStarted', e);
    } finally {
      const id = removeMatch(embed);
      info('handlePubobotMatchStarted', `Removed pubobot match ${id}`);
    }
  }
}

function handleDraftCollect(message: Message) {
  if (!message.inGuild()) {
    return;
  }
  const embed = message.embeds[0];
  const pubMatch = getPubobotMatch(embed);

  if (!pubMatch) {
    info('handleDraftCollect', 'Pubobot match not found');
    return;
  }
  if (!pubMatch.synced) {
    info('handleDraftCollect', `Pubobot match ${pubMatch.id} not in sync`);
    return;
  }

  info(
    'handleDraftCollect',
    `<${message.channel.name}>: Received embed with title "${message.embeds[0]?.title}"`
  );

  pubMatch.setEmbed(embed);

  if (pubMatch.getStatus() === MatchStatus.Open) {
    return handlePubobotMatchDrafting(pubMatch);
  }
}

async function handlePubobotMatchDrafting(pubMatch: PubobotMatch) {
  try {
    await pubMatch.updateMap();
    await pubMatch.updateDraftingPlayers();

    const pickList = await buildDraftWithConfig(pubMatch);

    if (pickList) {
      await createDraftPoll(pickList, pubMatch);
    }

    await pubMatch.syncMatch({ status: MatchStatus.Drafting });
  } catch (e) {
    error('handlePubobotMatchDrafting', e);
  }
}
