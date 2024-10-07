import Router from '@koa/router';
import { restartAllActiveServices } from '@bf2-matchmaking/railway-service-restart';

export const rootRouter = new Router({
  prefix: '/admin',
});

rootRouter.post('/reset', async (ctx) => {
  setTimeout(async () => restartAllActiveServices, 1000);
  ctx.status = 202;
  ctx.body = 'Restarting services...';
});
