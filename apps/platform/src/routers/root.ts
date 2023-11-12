import Router from '@koa/router';
import {
  createServerInstance,
  deleteServerInstance,
  getServerInstances,
} from '../services/vultr';
import { info } from '@bf2-matchmaking/logging';

export const rootRouter = new Router();

rootRouter.get('/servers', async (ctx) => {
  ctx.body = await getServerInstances();
});

rootRouter.post('/servers', async (ctx) => {
  const { body } = ctx.request;
  if (!body.name || !body.region) {
    ctx.status = 400;
    return;
  }

  const instance = await createServerInstance(body.name, body.region);
  info('POST /servers', `Instance created: ${instance.main_ip} - ${instance.status}`);
  ctx.body = instance;
});

rootRouter.delete('/servers/:id', async (ctx) => {
  ctx.body = await deleteServerInstance(ctx.params.id);
});

rootRouter.get('/health', (ctx) => {
  ctx.body = 'Ok';
});