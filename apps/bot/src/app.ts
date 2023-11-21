import 'dotenv/config';
import Koa from 'koa';
import logger from 'koa-logger';
import { bodyParser } from '@koa/bodyparser';
import { error, info } from '@bf2-matchmaking/logging';
import { rootRouter } from './routers/root';
import { initChannelListener } from './discord/channel-manager';
import { initScheduledEventsListener } from './discord/scheduled-events-listener';
import { getDiscordClient } from './discord/client';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5003;

getDiscordClient()
  .then(() => {
    initChannelListener();
    initScheduledEventsListener();
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
