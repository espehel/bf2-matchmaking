import 'dotenv/config';
import Koa from 'koa';
import logger from 'koa-logger';
import { bodyParser } from '@koa/bodyparser';
import { error, info } from '@bf2-matchmaking/logging';
import { rootRouter } from './routers/root';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5003;
new Koa()
  .use(logger())
  .use(bodyParser())
  .use(rootRouter.routes())
  .use(rootRouter.allowedMethods())
  .listen(PORT, () => {
    info('app', `platform listening on port ${PORT}`);
  });
