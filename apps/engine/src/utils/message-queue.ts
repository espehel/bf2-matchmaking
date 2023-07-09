import { error, info } from '@bf2-matchmaking/logging';
import Queue from 'better-queue';
import { DiscordMatch, MatchStatus } from '@bf2-matchmaking/types';
import {
  createPlayerMentions,
  createSummonedReactions,
  deleteAllReactions,
  editChannelMessage,
  getChannelMessages,
  getLastMatchMessage,
  getMatchEmbed,
  removeEmbeds,
  replaceEmbed,
  sendChannelMessage,
} from '@bf2-matchmaking/discord';
import { findPlayerName } from '@bf2-matchmaking/utils';
import { fetchPlayerName } from '../services/match-player-service';

interface MessageTask {
  id: number;
  type: 'summon' | 'draft' | 'info';
  match: DiscordMatch;
}

interface PlayerMessageTask extends Omit<MessageTask, 'type'> {
  type: 'join' | 'leave';
  playerId?: string;
}

const queue = new Queue<MessageTask | PlayerMessageTask>(
  async (task: MessageTask | PlayerMessageTask, cb) => {
    info('message-queue', `Executing task ${task.type} for match ${task.match.id}`);
    const { data, error } = await processTask(task);
    cb(error, data);
  },
  { concurrent: 1 }
);

const processTask = async (task: MessageTask | PlayerMessageTask) => {
  const { data: messages, error: messagesErr } = await getChannelMessages(
    task.match.config.channel
  );

  if (!messages) {
    return { error: messagesErr };
  }

  const lastMessage = getLastMatchMessage(messages, [task.match]);
  if (!lastMessage || task.type === 'summon') {
    await removeEmbeds(messages, [task.match]);
  } else {
    await removeEmbeds(messages.slice(1), [task.match]);
  }

  const embed = getMatchEmbed(task.match, await createEmbedDescription(task));

  if (lastMessage && task.type !== 'summon') {
    info('message-queue', `Editing message for match ${task.match.id}`);
    const result = await editChannelMessage(lastMessage.channel_id, lastMessage.id, {
      embeds: replaceEmbed(lastMessage, embed, [task.match]),
    });

    if (task.type === 'draft' && result.data) {
      await deleteAllReactions(result.data.channel_id, result.data.id);
    }
    return result;
  }

  info('message-queue', `Sending message for match ${task.match.id}`);
  const { data: sentMessage, error: sendErr } = await sendChannelMessage(
    task.match.config.channel,
    { embeds: [embed] }
  );

  if (!sentMessage) {
    return { error: sendErr };
  }

  if (task.match.status === MatchStatus.Summoning) {
    info('message-queue', `Reacting to message for match ${task.match.id}`);
    await createSummonedReactions(task.match.config.channel, sentMessage);
  }

  return { data: sentMessage };
};

const createEmbedDescription = async (task: MessageTask | PlayerMessageTask) => {
  switch (task.type) {
    case 'join':
      return `${findPlayerName(task.match, task.playerId) || 'Player'} joined`;
    case 'leave':
      return `${await fetchPlayerName(task.playerId)} left`;
    case 'summon':
      return `Ready up! ${createPlayerMentions(task.match)}`;
  }
};

queue.on('error', (e) => error('message-queue', e));
queue.on('empty', () => info('message-queue', 'Queue emptied'));
queue.on('drain', () => info('message-queue', 'Queue drained'));
queue.on('task_queued', () => info('message-queue', 'Task queued'));
queue.on('task_accepted', () => info('message-queue', 'Task accepted'));
queue.on('task_started', () => info('message-queue', 'Task started'));
queue.on('task_finish', () => info('message-queue', 'Task finished'));
queue.on('task_failed', () => info('message-queue', 'Task failed'));

export const pushInfoMessage = (match: DiscordMatch) =>
  queue.push({ id: match.id, match, type: 'info' });
export const pushSummonMessage = (match: DiscordMatch) =>
  queue.push({ id: match.id, match, type: 'summon' });
export const pushDraftMessage = (match: DiscordMatch) =>
  queue.push({ id: match.id, match, type: 'draft' });
export const pushJoinMessage = (match: DiscordMatch, playerId: string) =>
  queue.push({ id: match.id, match, playerId, type: 'join' });
export const pushLeaveMessage = (match: DiscordMatch, playerId: string | undefined) =>
  queue.push({ id: match.id, match, playerId, type: 'leave' });
