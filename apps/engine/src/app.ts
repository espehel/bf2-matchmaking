import 'dotenv/config';
import { initChannelListener } from './discord/channel-manager';
import { discordClient } from './discord/client';
import { info, warn } from '@bf2-matchmaking/logging';
import { initScheduledEventsListener } from './discord/scheduled-events-listener';
import { assertString } from '@bf2-matchmaking/utils';
import { createServer } from 'node:http';
import { IncomingMessage, ServerResponse } from 'node:http';
import { json } from '@bf2-matchmaking/redis/json';
import { isDevelopment } from '@bf2-matchmaking/utils/src/process-utils';
import { scheduleCloseOldMatchesJob } from './jobs/closeOldMatches';
import { scheduleStartScheduledMatchesJob } from './jobs/startScheduledMatches';
import { scheduleActiveServersJob } from './jobs/update-active-servers';
import { scheduleIdleServersJob } from './jobs/update-idle-servers';
import { scheduleCloseOldChallengesJob } from './jobs/closeOldChallenges';
import { hash } from '@bf2-matchmaking/redis/hash';
import { DateTime } from 'luxon';
import { initGatherQueue } from './gather/gather-service';
import { scheduleResetServersJob } from './jobs/resetServers';

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

    scheduleCloseOldMatchesJob();
    scheduleIdleServersJob();
    scheduleActiveServersJob();
    scheduleStartScheduledMatchesJob();
    scheduleCloseOldChallengesJob();
    //set8v8queueCheckinTask.start();
    //reset8v8queueCheckinTask.start();
    scheduleResetServersJob();
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
