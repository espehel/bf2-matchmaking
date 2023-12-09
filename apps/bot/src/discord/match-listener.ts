import { DiscordConfig } from '@bf2-matchmaking/types';
import { error, info, logMessage } from '@bf2-matchmaking/logging';
import {
  isPubobotMatchCheckIn,
  isPubobotMatchDrafting,
  isPubobotMatchStarted,
  replyMessage,
} from './utils';
import { getMatchStartedEmbed, getRulesEmbedByConfig } from '@bf2-matchmaking/discord';
import { Client, Message, MessageCollector } from 'discord.js';
import {
  createDraftingMatchFromPubobotEmbed,
  getPubobotId,
  startTopLocationPoll,
  hasPubotId,
  startMatchFromPubobotEmbed,
} from '../services/pubobot-service';
import { generateServer } from '../services/platform-service';

export function addMatchListener(
  collector: MessageCollector,
  config: DiscordConfig,
  client: Client<true>
) {
  collector.filter = messageFilter;
  collector.on('collect', handleCollect(config, client));
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
  /*if (isPubobotMatchDrafting(embed)) {
    return !hasPubotId(pubobotId, 'drafting');
  }
  return isPubobotMatchCheckIn(embed) && !hasPubotId(pubobotId, 'checkin');*/
  return isPubobotMatchDrafting(embed) && !hasPubotId(pubobotId);
}
function handleCollect(config: DiscordConfig, client: Client<true>) {
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

  function handlePubobotMatchCheckIn(message: Message<true>) {
    //addCheckinMatch(message.embeds[0], 'checkin');
  }

  async function handlePubobotMatchDrafting(message: Message<true>) {
    try {
      const match = await createDraftingMatchFromPubobotEmbed(
        message.embeds[0],
        message.guild.members,
        client.users,
        config
      );

      const location = await startTopLocationPoll(match, message);
      await generateServer(location, match);
    } catch (e) {
      error('handlePubobotMatchDrafting', e);
    }
  }
  async function handlePubobotMatchStarted(message: Message) {
    try {
      const match = await startMatchFromPubobotEmbed(message.embeds[0], client.users);

      await replyMessage(message, {
        embeds: [getMatchStartedEmbed(match), getRulesEmbedByConfig(config)],
      });
      logMessage(`Channel ${message.channel.id}: Match ${match.id} started`, {
        match,
      });
    } catch (e) {
      error('handlePubobotMatchStarted', e);
    }
  }
}
