import 'dotenv/config';
import Koa from 'koa';
import logger from 'koa-logger';
import { bodyParser } from '@koa/bodyparser';
import { rootRouter } from './routers/root';
import { error, info } from '@bf2-matchmaking/logging';
import { loadMapsCache } from './services/maps';
import cron from 'node-cron';
import { isDevelopment } from '@bf2-matchmaking/utils/src/process-utils';
import { serversRouter } from './routers/servers';
import { matchesRouter } from './routers/matches';
import { initServers } from './services/server/server-manager';
import { updateLiveServers } from './tasks/update-live-servers';
import { updateIdleServers } from './tasks/update-idle-servers';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5002;
loadMapsCache();

const updateLiveServersTask = cron.schedule('*/10 * * * * *', updateLiveServers, {
  scheduled: false,
});
const updateIdleServersTask = cron.schedule('*/30 * * * * *', updateIdleServers, {
  scheduled: false,
});

initServers()
  .then(() => {
    if (!isDevelopment()) {
      updateIdleServersTask.start();
      updateLiveServersTask.start();
    }
  })
  .catch((err) => error('app', err));

new Koa()
  .use(logger())
  .use(bodyParser())
  .use(rootRouter.routes())
  .use(rootRouter.allowedMethods())
  .use(serversRouter.routes())
  .use(serversRouter.allowedMethods())
  .use(matchesRouter.routes())
  .use(matchesRouter.allowedMethods())
  .listen(PORT, () => {
    info('app', `platform listening on port ${PORT}`);
  });
