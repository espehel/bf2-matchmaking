import { Message, MessageCollector } from 'discord.js';
import { error, info } from '@bf2-matchmaking/logging';
import { json } from '@bf2-matchmaking/redis/json';
import { MatchConfigsRow } from '@bf2-matchmaking/types';
import { assertObj } from '@bf2-matchmaking/utils';
import { getTextChannel } from './services/message-service';
import { set } from '@bf2-matchmaking/redis/set';
import { CHANNEL_ID_8v8 } from '@bf2-matchmaking/discord';

export async function listenTo8v8Channel() {
  try {
    const channel = await getTextChannel(CHANNEL_ID_8v8);
    const collector = channel.createMessageCollector();
    await addQueueListener(collector);
  } catch (e) {
    error('listenTo8v8Channel', e);
  }
}

async function addQueueListener(collector: MessageCollector) {
  const config = await json<MatchConfigsRow>(`config:${CHANNEL_ID_8v8}`).get();
  assertObj(config, '8v8 config not found');

  collector.filter = queueFilter;
  collector.on('collect', handleQueueCollect);
  collector.on('end', (collected, reason) => {
    info(
      'addQueueListener',
      `Stopped listening to ${config.name}, after collecting ${collected.size} messages, because ${reason}.`
    );
  });
  info('addQueueListener', `Listening to ${config.name}`);
}

export function queueFilter(message: Message) {
  return message.content.includes('> **2100** (');
}

async function handleQueueCollect(message: Message) {
  if (!message.inGuild()) {
    return;
  }
  const line = message.content
    .split('\n')
    .find((line) => line.startsWith('> **2100** ('));
  const players = line?.matchAll(/(?<=[`])[^\`/]+(?=[\`]|$)/g);
  assertObj(players, '8v8 players not found');
  const playerList = Array.from(players, (m) => m[0]);
  console.log(playerList);
  await set('pubobot:2100:players').del();
  if (playerList.length > 0) {
    await set('pubobot:2100:players').add(...playerList);
  }
}
