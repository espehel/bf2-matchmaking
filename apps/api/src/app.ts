import 'dotenv/config';
import Koa from 'koa';
import logger from 'koa-logger';
import { bodyParser } from '@koa/bodyparser';
import { info, warn } from '@bf2-matchmaking/logging';
import Router from '@koa/router';
import { webhooksRouter } from './webhooks/router';
import { platformRouter } from './platform/router';
import { cacheRouter } from './cache/router';
import { matchesRouter } from './matches/router';
import { serversRouter } from './servers/router';
import { adminRouter } from './admin/router';
import { hash } from '@bf2-matchmaking/redis/hash';
import { DateTime } from 'luxon';
import { isDevelopment } from '@bf2-matchmaking/utils/src/process-utils';
import { playersRouter } from './players/router';
import { gathersRouter } from './gather/router';
import { bearerToken } from './auth';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5004;

export const rootRouter = new Router();
rootRouter.get('/health', (ctx) => {
  ctx.body = 'Ok';
});

new Koa()
  .use(logger())
  .use(bodyParser())
  .use(bearerToken())
  .use(adminRouter.routes())
  .use(adminRouter.allowedMethods())
  .use(cacheRouter.routes())
  .use(cacheRouter.allowedMethods())
  .use(gathersRouter.routes())
  .use(gathersRouter.allowedMethods())
  .use(matchesRouter.routes())
  .use(matchesRouter.allowedMethods())
  .use(platformRouter.routes())
  .use(platformRouter.allowedMethods())
  .use(playersRouter.routes())
  .use(playersRouter.allowedMethods())
  .use(serversRouter.routes())
  .use(serversRouter.allowedMethods())
  .use(webhooksRouter.routes())
  .use(webhooksRouter.allowedMethods())
  .use(rootRouter.routes())
  .use(rootRouter.allowedMethods())
  .listen(PORT, async () => {
    info('app', `api listening on port ${PORT}`);
    if (isDevelopment()) {
      warn('app', 'Starting in development mode');
      return;
    }
    await hash('system').set({ apiStartedAt: DateTime.now().toISO() });
  });
