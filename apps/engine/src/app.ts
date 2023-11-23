import 'dotenv/config';
import Koa from 'koa';
import logger from 'koa-logger';
import { bodyParser } from '@koa/bodyparser';
import cron from 'node-cron';
import { webhooksRouter } from './routers/webhooks';
import matches from './state/matches';
import { closeOldMatches } from './tasks/closeOldMatches';
import { rootRouter } from './routers/root';
import { startScheduledMatches } from './tasks/startScheduledMatches';
import { matchesRouter } from './routers/matches';

matches.loadActive().loadScheduled();

cron.schedule('0 16 * * *', closeOldMatches);
cron.schedule('0,30 * * * *', startScheduledMatches);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5004;
new Koa()
  .use(logger())
  .use(bodyParser())
  .use(matchesRouter.routes())
  .use(matchesRouter.allowedMethods())
  .use(webhooksRouter.routes())
  .use(webhooksRouter.allowedMethods())
  .use(rootRouter.routes())
  .use(rootRouter.allowedMethods())
  .listen(PORT, () => {
    console.log(`engine listening on port ${PORT}`);
  });
