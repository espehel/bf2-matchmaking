import 'dotenv/config';
import Koa from 'koa';
import logger from 'koa-logger';
import { bodyParser } from '@koa/bodyparser';
import { rootRouter } from './routers/root';
import { error, info } from '@bf2-matchmaking/logging';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5002;

new Koa()
  .use(logger())
  .use(bodyParser())
  .use(rootRouter.routes())
  .use(rootRouter.allowedMethods())
  .listen(PORT, () => {
    info('app', `platform listening on port ${PORT}`);
  });
