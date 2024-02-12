import { DiscordConfig, MatchStatus } from '@bf2-matchmaking/types';
import { error, info, logMessage } from '@bf2-matchmaking/logging';
import {
  isPubobotMatchCheckIn,
  isPubobotMatchDrafting,
  isPubobotMatchStarted,
  isTextBasedChannel,
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
  getTestChannel,
  replyMessage,
  sendDraftMessage,
  sendServersMessage,
  sendSummoningMessage,
} from '../services/message-service';
import { assertObj } from '@bf2-matchmaking/utils';
import { handleDraftPollResult, startDraftPoll } from './message-polls';
import { buildMixTeams } from '../services/draft-utils';

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

export function messageFilter(message: Message) {
  if (message.content === 'test embed') {
    return true;
  }
  const [embed] = message.embeds;
  const pubobotId = getPubobotId(embed);
  if (!pubobotId) {
    return false;
  }
  if (isPubobotMatchStarted(embed)) {
    info('messageFilter', `Pubobot match ${pubobotId} started`);
    return true;
  }
  if (isPubobotMatchDrafting(embed)) {
    info('messageFilter', `Pubobot match ${pubobotId} drafting`);
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
        await pubMatch.setMap(embed);
        await pubMatch.updateMatch({ status: MatchStatus.Drafting });
      } else {
        pubMatch = await PubobotMatch.fromDraftingEmbed(
          config,
          message.guild.members,
          embed
        );
        addMatch(pubMatch);
      }

      // TODO handle not all players being included
      if (
        pubMatch.match.teams.length === pubMatch.match.config.size &&
        message.channel.id === '1035999895968030800' &&
        isTextBasedChannel(message.channel)
      ) {
        const teams = buildMixTeams(pubMatch.match);
        startDraftPoll(pubMatch, teams, message.channel).then(
          handleDraftPollResult(pubMatch, teams, message.channel)
        );
      }
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

      await sendServersMessage(pubMatch.match, message.channel);
      await sendDraftMessage(pubMatch.match);
    } catch (e) {
      error('handlePubobotMatchStarted', e);
    } finally {
      const id = removeMatch(embed);
      info('handlePubobotMatchStarted', `Removed pubobot match ${id}`);
    }
  }
}
