import Router from '@koa/router';
import {
  createServerInstance,
  deleteServerInstance,
  getInstanceByIp,
  getServerInstances,
} from '../services/vultr';
import { info } from '@bf2-matchmaking/logging';
import { createDnsRecord, getDnsByName } from '../services/cloudflare';
import { getMatchIdFromDnsName } from '@bf2-matchmaking/utils';

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

  const instance = await createServerInstance(
    body.name,
    body.region,
    body.label,
    body.tag
  );
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

rootRouter.get('/servers/:ip', async (ctx) => {
  ctx.body = await getInstanceByIp(ctx.params.ip);
});
rootRouter.delete('/servers/:ip', async (ctx) => {
  const dns = await getDnsByName(ctx.params.ip);
  const ip = dns?.content || ctx.params.ip;
  ctx.body = await deleteServerInstance(ip);
});

rootRouter.post('/servers/:ip/dns', async (ctx) => {
  const instance = await getInstanceByIp(ctx.params.ip);

  if (!instance.tag) {
    ctx.status = 400;
    ctx.body = { message: 'Instance does not contain tag' };
    return;
  }

  const dns = await createDnsRecord(instance.tag, ctx.params.ip);
  if (!dns) {
    ctx.status = 500;
    ctx.body = { message: 'Failed to create DNS record' };
    return;
  }

  ctx.body = dns;
});

rootRouter.get('/health', (ctx) => {
  ctx.body = 'Ok';
});
