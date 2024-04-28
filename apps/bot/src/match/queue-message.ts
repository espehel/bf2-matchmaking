import { isNotNull } from '@bf2-matchmaking/types';
import { EmbedBuilder } from 'discord.js';
import { APIEmbedField } from 'discord-api-types/v10';
import { MatchQueue } from './MatchQueue';
import { buildMatchPlayerlabel, getLiveMatchField } from '@bf2-matchmaking/discord';
import {
  compareFullName,
  compareIsCaptain,
  getTeamPlayers,
} from '@bf2-matchmaking/utils';

export function buildQueueMessage(matchQueue: MatchQueue, statusMessage: string | null) {
  const embed = new EmbedBuilder()
    .setTitle(buildTitle(matchQueue))
    .setDescription(buildDescription(matchQueue, statusMessage))
    .setFields(buildFields(matchQueue))
    .toJSON();
  return { embeds: [embed] };
}
function buildTitle(matchQueue: MatchQueue) {
  switch (matchQueue.state) {
    case 'queue':
      return `**4v4** (${matchQueue.queue.length}/${matchQueue.config.size})`;
    case 'summon':
      return `Join ${matchQueue.server.info?.serverName}`;
    case 'start':
      return matchQueue.match
        ? `Match ${matchQueue.match.id} started`
        : 'Match starting...';
  }
  return null;
}
function buildDescription(matchQueue: MatchQueue, statusMessage: string | null) {
  if (matchQueue.state === 'queue' && statusMessage) {
    return statusMessage;
  }
  if (matchQueue.state === 'summon' && matchQueue.queueTimeout) {
    return `Check in by joining server in <t:${matchQueue.queueTimeout.toUnixInteger()}:R>`;
  }
  return null;
}
function buildFields(matchQueue: MatchQueue): Array<APIEmbedField> {
  return ([] as Array<APIEmbedField | null>)
    .concat(buildQueueField(matchQueue))
    .concat(buildSummonField(matchQueue))
    .concat(buildTeamField(matchQueue))
    .concat(buildServerField(matchQueue))
    .concat(buildMatchField(matchQueue))
    .filter(isNotNull);
}

function buildQueueField(matchQueue: MatchQueue) {
  if (matchQueue.state !== 'queue') {
    return null;
  }
  if (!matchQueue.queue.length) {
    return { name: 'Queue', value: '-' };
  }
  return {
    name: 'Queue',
    value: matchQueue.queue.map((p) => `\`${p.nick}\``).join(', '),
  };
}

function buildSummonField(matchQueue: MatchQueue) {
  if (matchQueue.state !== 'summon') {
    return null;
  }
  return {
    name: 'Players',
    value: matchQueue
      .getPool()
      .map((p) => `${matchQueue.readyPlayers.includes(p.id) ? '✅' : ''} ${p.nick}`)
      .join('\n'),
  };
}

function buildServerField(matchQueue: MatchQueue) {
  if (matchQueue.state === 'queue') {
    return null;
  }
  return [
    {
      name: 'address:',
      value: `\`\`\`${matchQueue.server.address}\`\`\``,
      inline: true,
    },
    {
      name: 'port',
      value: `\`\`\`${matchQueue.server.port}\`\`\``,
      inline: true,
    },
  ];
}

function buildMatchField(matchQueue: MatchQueue) {
  if (matchQueue.state !== 'start') {
    return null;
  }
  return matchQueue.match ? getLiveMatchField(matchQueue.match.id) : null;
}

function buildTeamField(matchQueue: MatchQueue) {
  if (matchQueue.state !== 'start' || !matchQueue.match) {
    return null;
  }
  const { teams, players } = matchQueue.match;
  return [
    {
      name: 'Team A',
      value: getTeamPlayers(teams, players, 1)
        .sort(compareFullName)
        .sort(compareIsCaptain)
        .map(buildMatchPlayerlabel)
        .join('\n'),
      inline: true,
    },
    {
      name: 'Team B',
      value: getTeamPlayers(teams, players, 2)
        .sort(compareFullName)
        .sort(compareIsCaptain)
        .map(buildMatchPlayerlabel)
        .join('\n'),
      inline: true,
    },
  ];
}
