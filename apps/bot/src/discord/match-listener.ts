import { DiscordConfig, MatchStatus } from '@bf2-matchmaking/types';
import { error, info, logMessage } from '@bf2-matchmaking/logging';
import {
  isPubobotMatchCheckIn,
  isPubobotMatchDrafting,
  isPubobotMatchStarted,
  startTopLocationPoll,
} from './utils';
import { getMatchStartedEmbed, getRulesEmbedByConfig } from '@bf2-matchmaking/discord';
import { Message, MessageCollector } from 'discord.js';
import { generateServer } from '../services/platform-service';
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
  sendDraftMessage,
  sendSummoningMessage,
} from '../services/message-service';
import { assertObj } from '@bf2-matchmaking/utils';

export function addMatchListener(collector: MessageCollector, config: DiscordConfig) {
  collector.filter = messageFilter;
  collector.on('collect', handleCollect(config));
  collector.on('end', (collected, reason) => {
    info(
      'addMatchListener',
      `Stopped listening to ${config.name}, after collecting ${collected.size} messages, because ${reason}.`
    );
  });
  info('addMatchListener', `Listening to ${config.name}`);
}

function messageFilter(message: Message) {
  if (message.content === 'test embed') {
    return true;
  }
  const [embed] = message.embeds;
  const pubobotId = getPubobotId(embed);
  if (!pubobotId) {
    return false;
  }
  if (isPubobotMatchStarted(embed)) {
    return true;
  }
  if (isPubobotMatchDrafting(embed)) {
    return !hasPubotId(pubobotId, MatchStatus.Drafting);
  }
  return isPubobotMatchCheckIn(embed) && !hasPubotId(pubobotId, MatchStatus.Summoning);
}
function handleCollect(config: DiscordConfig) {
  return async (message: Message) => {
    info(
      'handleCollect',
      `Received embed with title "${message.embeds[0]?.title}" in ${config.name} channel`
    );

    if (!message.inGuild()) {
      return;
    }

    if (isPubobotMatchCheckIn(message.embeds[0])) {
      return handlePubobotMatchCheckIn(message);
    }
    if (isPubobotMatchDrafting(message.embeds[0])) {
      return handlePubobotMatchDrafting(message);
    }

    if (isPubobotMatchStarted(message.embeds[0])) {
      return handlePubobotMatchStarted(message);
    }
  };

  async function handlePubobotMatchCheckIn(message: Message<true>) {
    const embed = message.embeds[0];
    try {
      const match = await PubobotMatch.fromCheckInEmbed(config, embed);
      addMatch(match);

      if (match?.match) {
        await sendSummoningMessage(match.match);
      }
    } catch (e) {
      error('handlePubobotMatchCheckIn', e);
    }
  }

  async function handlePubobotMatchDrafting(message: Message<true>) {
    const embed = message.embeds[0];
    try {
      let pubMatch = getPubobotMatch(embed);
      if (pubMatch) {
        await pubMatch.updateMatch({ status: MatchStatus.Drafting });
      } else {
        pubMatch = await PubobotMatch.fromDraftingEmbed(
          config,
          message.guild.members,
          embed
        );
        addMatch(pubMatch);
      }

      const location = await startTopLocationPoll(pubMatch.match, message);
      await generateServer(location, pubMatch.match);
    } catch (e) {
      error('handlePubobotMatchDrafting', e);
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
      logMessage(`Channel ${message.channel.id}: Match ${pubMatch.match.id} started`, {
        match: pubMatch.match,
      });

      await sendDraftMessage(pubMatch.match);
    } catch (e) {
      error('handlePubobotMatchStarted', e);
    } finally {
      const id = removeMatch(embed);
      info('handlePubobotMatchStarted', `Removed pubobot match ${id}`);
    }
  }
}
