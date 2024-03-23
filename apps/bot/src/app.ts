import 'dotenv/config';
import Koa from 'koa';
import logger from 'koa-logger';
import { bodyParser } from '@koa/bodyparser';
import { error, info } from '@bf2-matchmaking/logging';
import { rootRouter } from './routers/root';
import { initChannelListener } from './discord/channel-manager';
import { initScheduledEventsListener } from './discord/scheduled-events-listener';
import { getDiscordClient } from './discord/client';
import { loadServerLocations } from './services/location-service';
import { interactionsRouter } from './routers/interactions';
import { isDevelopment } from '@bf2-matchmaking/utils/src/process-utils';
import { listenToChannelJoin } from './teamspeak/teamspeak-service';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5001;

getDiscordClient()
  .then(loadServerLocations)
  .then(listenToChannelJoin)
  .then(() => {
    if (isDevelopment()) {
      return;
    }
    initChannelListener();
    initScheduledEventsListener();
  })
  .catch((e) => {
    error('app', e);
  });

new Koa()
  .use(logger())
  .use(interactionsRouter.routes())
  .use(interactionsRouter.allowedMethods())
  .use(bodyParser())
  .use(rootRouter.routes())
  .use(rootRouter.allowedMethods())
  .listen(PORT, () => {
    info('app', `bot listening on port ${PORT}`);
  });
