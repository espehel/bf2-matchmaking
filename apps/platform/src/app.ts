import 'dotenv/config';
import Koa from 'koa';
import logger from 'koa-logger';
import { bodyParser } from '@koa/bodyparser';
import { rootRouter } from './routers/root';
import { error, info } from '@bf2-matchmaking/logging';
import { loadStartupScripts } from './services/vultr';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5003;

loadStartupScripts()
  .then((startupScripts) => {
    info('app', `Loaded ${startupScripts.size} startup scripts`);
  })
  .catch((e) => {
    error('app', e);
  });

new Koa()
  .use(logger())
  .use(bodyParser())
  .use(rootRouter.routes())
  .use(rootRouter.allowedMethods())
  .listen(PORT, () => {
    info('app', `platform listening on port ${PORT}`);
  });
