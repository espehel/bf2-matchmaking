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
import { getClient } from '@bf2-matchmaking/redis/client';
import * as http from 'node:http';
import { IncomingMessage, ServerResponse } from 'node:http';
import { json } from '@bf2-matchmaking/redis/json';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5005;

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
    await getClient(); // TODO fix connect race without exposing client?
    await json('app:engine:state').set({});
    await initServers();
    await initChannelListener();
    initScheduledEventsListener();
    closeOldMatchesTask.start();
    startScheduledMatchesTask.start();
    updateLiveServersTask.start();
    updateIdleServersTask.start();
  })
  .then(async () => {
    http.createServer(requestListener).listen(PORT, () => {
      info('app', `Engine state api listening on port ${PORT}`);
    });
    info('app', 'Initialized!');
  });

function requestListener(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  switch (req.url) {
    case '/health':
      res.writeHead(200);
      res.end('OK');
      break;
    case '/state':
      json('app:engine:state')
        .get()
        .then((state) => {
          res.writeHead(200);
          res.end(JSON.stringify(state));
        });
      break;
    default:
      res.writeHead(404);
      res.end(JSON.stringify({ message: 'Resource not found' }));
  }
}
