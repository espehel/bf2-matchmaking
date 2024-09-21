import { set } from '@bf2-matchmaking/redis/set';
import { getTextChannel, sendMessage } from '../discord/services/message-service';
import { CHANNEL_ID_8v8 } from '@bf2-matchmaking/discord';
import { DateTime } from 'luxon';
import cron from 'node-cron';

export async function convert8v8queue() {
  const players = await set('pubobot:2100:players').members();
  const channel = await getTextChannel(CHANNEL_ID_8v8);
  for (const player of players) {
    await sendMessage(channel, `!add <@${player}> right-now-right-here`);
  }
}

async function set8v8queueCheckin() {
  const channel = await getTextChannel(CHANNEL_ID_8v8);
  await sendMessage(channel, '!reset 2000');
  await sendMessage(channel, '!set_queue 2100 check_in_timeout 00:04:00');
  await sendMessage(
    channel,
    `Check-in timeout set to **4 minutes** for 2100. Resetting **<t:${DateTime.now()
      .set({
        hour: 23,
        minute: 59,
        second: 0,
      })
      .toUnixInteger()}:R>**.`
  );
}
export const set8v8queueCheckinTask = cron.schedule('20 21 * * *', set8v8queueCheckin, {
  scheduled: false,
});

async function reset8v8queueCheckin() {
  const channel = await getTextChannel(CHANNEL_ID_8v8);
  await sendMessage(channel, '!set_queue 2100 check_in_timeout NULL');
  await sendMessage(channel, '!reset 2100');
  await sendMessage(channel, '**Reset** 2100 queue, check-in timeout **removed**.');
}
export const reset8v8queueCheckinTask = cron.schedule(
  '59 23 * * *',
  reset8v8queueCheckin,
  {
    scheduled: false,
  }
);
