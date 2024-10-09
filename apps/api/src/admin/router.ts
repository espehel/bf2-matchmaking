import Router from '@koa/router';
import { runService } from '@bf2-matchmaking/railway';

const RESTART_TOOL_SERVICE_ID = 'c5633c6e-3e36-4939-b2a6-46658cabd47e';

export const adminRouter = new Router({
  prefix: '/admin',
});

adminRouter.post('/reset', async (ctx) => {
  ctx.body = await runService(RESTART_TOOL_SERVICE_ID);
});
