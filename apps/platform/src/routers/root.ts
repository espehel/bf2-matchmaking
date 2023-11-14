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
  if (!body.name || !body.region || !body.label) {
    ctx.status = 400;
    ctx.body = { message: 'Missing name, region or label' };
    return;
  }

  const instance = await createServerInstance(body.name, body.region, body.label);
  if (!instance) {
    ctx.status = 500;
    ctx.body = { message: 'Failed to create server' };
    return;
  }

  info(
    'POST /servers',
    `Instance created. [region: "${instance.region}", label: "${instance.label}", status: "${instance.status}"]`
  );
  ctx.body = instance;
});

rootRouter.delete('/servers/:ip', async (ctx) => {
  ctx.body = await deleteServerInstance(ctx.params.ip);
});

rootRouter.get('/health', (ctx) => {
  ctx.body = 'Ok';
});
