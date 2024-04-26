import 'dotenv/config';
import Koa from 'koa';
import logger from 'koa-logger';
import { bodyParser } from '@koa/bodyparser';
import { rootRouter } from './routers/root';
import { error, info } from '@bf2-matchmaking/logging';
import { loadMapsCache } from './services/maps';
import cron from 'node-cron';
import { updateServers } from './tasks/update-servers';
import { updateMatches } from './tasks/update-matches';
import { isDevelopment } from '@bf2-matchmaking/utils/src/process-utils';
import { initLiveMatches } from './services/match/MatchManager';
import { serversRouter } from './routers/servers';
import { matchesRouter } from './routers/matches';
import { initServers } from './services/server/server-manager';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5002;
loadMapsCache();

const updateServersTask = cron.schedule('*/10 * * * * *', updateServers, {
  scheduled: false,
});
const updateMatchesTask = cron.schedule('*/2 * * * *', updateMatches, {
  scheduled: false,
});

initServers().catch((err) => error('app', err));

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
