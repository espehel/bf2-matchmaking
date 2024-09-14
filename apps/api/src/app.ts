import 'dotenv/config';
import Koa from 'koa';
import logger from 'koa-logger';
import { bodyParser } from '@koa/bodyparser';
import { error, info } from '@bf2-matchmaking/logging';
import { loadStartupScripts } from './platform/vultr';
import Router from '@koa/router';
import { webhooksRouter } from './webhooks/router';
import { platformRouter } from './platform/router';
import { cacheRouter } from './cache/router';
import { matchesRouter } from './matches/router';
import { serversRouter } from './servers/router';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5004;
loadStartupScripts()
  .then((startupScripts) => {
    info('app', `Loaded ${startupScripts.size} startup scripts`);
  })
  .catch((e) => {
    error('app', e);
  });

export const rootRouter = new Router();
rootRouter.get('/health', (ctx) => {
  ctx.body = 'Ok';
});

new Koa()
  .use(logger())
  .use(bodyParser())
  .use(cacheRouter.routes())
  .use(cacheRouter.allowedMethods())
  .use(matchesRouter.routes())
  .use(matchesRouter.allowedMethods())
  .use(platformRouter.routes())
  .use(platformRouter.allowedMethods())
  .use(serversRouter.routes())
  .use(serversRouter.allowedMethods())
  .use(webhooksRouter.routes())
  .use(webhooksRouter.allowedMethods())
  .use(rootRouter.routes())
  .use(rootRouter.allowedMethods())
  .listen(PORT, () => {
    info('app', `api listening on port ${PORT}`);
  });
