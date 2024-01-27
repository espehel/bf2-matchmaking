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
import { isDevelopment } from '@bf2-matchmaking/utils/src/process-utils';
import { MatchStatus } from '@bf2-matchmaking/types';
import { generateMatchServers } from './tasks/generateMatchServers';

matches.loadMatches().then(() => {
  matches.get(MatchStatus.Summoning).forEach((match) => {
    //joinMatchRoom(match);
  });
});

if (!isDevelopment()) {
  cron.schedule('0 16 * * *', closeOldMatches);
  cron.schedule('15,45 * * * *', generateMatchServers);
  cron.schedule('0,30 * * * *', startScheduledMatches);
}

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
