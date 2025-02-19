import 'dotenv/config';
import { initChannelListener } from './discord/channel-manager';
import { discordClient } from './discord/client';
import { info, warn } from '@bf2-matchmaking/logging';
import { initScheduledEventsListener } from './discord/scheduled-events-listener';
import { assertString } from '@bf2-matchmaking/utils';
import { initServers } from './server/server-manager';
import { getClient } from '@bf2-matchmaking/redis/client';
import { createServer } from 'node:http';
import { IncomingMessage, ServerResponse } from 'node:http';
import { json } from '@bf2-matchmaking/redis/json';
import { isDevelopment } from '@bf2-matchmaking/utils/src/process-utils';
import { closeOldMatchesTask } from './tasks/closeOldMatches';
import { startScheduledMatchesTask } from './tasks/startScheduledMatches';
import { updateLiveServersTask } from './tasks/update-live-servers';
import { updateIdleServersTask } from './tasks/update-idle-servers';
import { closeOldChallengesTask } from './tasks/closeOldChallenges';
import {
  set8v8queueCheckinTask,
  reset8v8queueCheckinTask,
} from './tasks/convert8v8queue';
import { hash } from '@bf2-matchmaking/redis/hash';
import { DateTime } from 'luxon';
import { initGatherQueue } from './gather/gather-service';
import { resetServersTask } from './tasks/resetServers';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5006;

info('app', 'Starting...');
assertString(process.env.DISCORD_TOKEN, 'process.env.DISCORD_TOKEN is not defined');
discordClient
  .login(process.env.DISCORD_TOKEN)
  .then(async () => {
    if (isDevelopment()) {
      warn('app', 'Starting in development mode');
      return;
    }

    await hash('system').set({ engineStartedAt: DateTime.now().toISO() });
    await Promise.all([
      json('app:engine:state').set({}),
      initChannelListener(),
      initGatherQueue(20),
    ]);
    initScheduledEventsListener();

    closeOldMatchesTask.start();
    startScheduledMatchesTask.start();
    updateLiveServersTask.start();
    updateIdleServersTask.start();
    closeOldChallengesTask.start();
    set8v8queueCheckinTask.start();
    reset8v8queueCheckinTask.start();
    resetServersTask.start();
  })
  .then(async () => {
    createServer(requestListener).listen(PORT, () => {
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
