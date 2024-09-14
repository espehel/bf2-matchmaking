import 'dotenv/config';
import { initChannelListener } from './discord/channel-manager';
import { discordClient } from './discord/client';
import { info } from '@bf2-matchmaking/logging';
import { initScheduledEventsListener } from './discord/scheduled-events-listener';
import { assertString } from '@bf2-matchmaking/utils';
import cron from 'node-cron';
import { startScheduledMatches } from './tasks/startScheduledMatches';
import { closeOldMatches } from './tasks/closeOldMatches';
import { updateLiveServers } from './tasks/update-live-servers';
import { updateIdleServers } from './tasks/update-idle-servers';
import { initServers } from './server/server-manager';

const closeOldMatchesTask = cron.schedule('0 0,8,16 * * *', closeOldMatches, {
  scheduled: false,
});
const startScheduledMatchesTask = cron.schedule('0,30 * * * *', startScheduledMatches, {
  scheduled: false,
});
const updateLiveServersTask = cron.schedule('*/10 * * * * *', updateLiveServers, {
  scheduled: false,
});
const updateIdleServersTask = cron.schedule('*/30 * * * * *', updateIdleServers, {
  scheduled: false,
});

info('app', 'Starting...');
assertString(process.env.DISCORD_TOKEN, 'process.env.DISCORD_TOKEN is not defined');
discordClient
  .login(process.env.DISCORD_TOKEN)
  .then(async () => {
    await initServers();
    await initChannelListener();
    initScheduledEventsListener();
    closeOldMatchesTask.start();
    startScheduledMatchesTask.start();
    updateLiveServersTask.start();
    updateIdleServersTask.start();
  })
  .then(() => {
    info('app', 'Initialized!');
  });
