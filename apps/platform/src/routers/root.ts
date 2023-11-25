import Router from '@koa/router';
import {
  createServerInstance,
  deleteServerInstance,
  getInstanceByIp,
  getLocations,
  getServerInstances,
  pollInstance,
} from '../services/vultr';
import { info } from '@bf2-matchmaking/logging';
import {
  createDnsRecord,
  deleteDnsRecord,
  getDnsByIp,
  getDnsByName,
} from '../services/cloudflare';
import { Instance } from '@bf2-matchmaking/types/src/vultr';
import { Context } from 'koa';
import { DEFAULTS } from '../constants';

export const rootRouter = new Router();

rootRouter.get('/servers', async (ctx) => {
  ctx.body = await getServerInstances();
});

interface ServersRequestBody extends Omit<Request, 'body'> {
  name?: string;
  region?: string;
  match?: string;
  map?: string;
  vehicles?: string;
}
rootRouter.post('/servers', async (ctx: Context) => {
  const { name, region, match, map, vehicles } = <ServersRequestBody>ctx.request.body;
  if (!name || !region || !match) {
    ctx.status = 400;
    ctx.body = { message: 'Missing name, region, match, map or vehicles' };
    return;
  }

  const instance = await createServerInstance(
    name,
    region,
    match,
    map || DEFAULTS.map,
    vehicles === 'true' ? vehicles : ''
  );
  if (!instance) {
    ctx.status = 500;
    ctx.body = { message: 'Failed to create server' };
    return;
  }

  pollInstance(instance.id, async (instance: Instance) => {
    if (instance.main_ip !== '0.0.0.0') {
      await createDnsRecord(instance.tag, instance.main_ip);
      return true;
    }
    return false;
  });

  info(
    'POST /servers',
    `Instance created. [region: "${instance.region}", label: "${instance.label}", tag: "${instance.tag}"]`
  );
  ctx.body = instance;
});

rootRouter.get('/servers/:ip', async (ctx) => {
  ctx.body = await getInstanceByIp(ctx.params.ip);
});
rootRouter.delete('/servers/:ip', async (ctx: Context) => {
  const dns = await getDnsByName(ctx.params.ip);

  const instance = await getInstanceByIp(dns?.content || ctx.params.ip);
  ctx.assert(instance, 404, 'Server not found');

  await deleteServerInstance(instance.id);
  if (dns) {
    await deleteDnsRecord(dns.id);
  }
  info(
    'DELETE /servers',
    `Instance deleted. [ip: "${ctx.params.ip}", dns content: "${dns?.content}", label: "${instance.label}"]`
  );
  ctx.status = 204;
});

rootRouter.post('/servers/:ip/dns', async (ctx: Context) => {
  const instance = await getInstanceByIp(ctx.params.ip);
  ctx.assert(instance, 404, 'Server not found');

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

rootRouter.get('/servers/:ip/dns', async (ctx) => {
  const dns =
    ctx.query.type === 'name'
      ? await getDnsByName(ctx.params.ip)
      : await getDnsByIp(ctx.params.ip);
  if (!dns) {
    ctx.status = 400;
    ctx.body = { message: `Could not find DNS record for ${ctx.params.ip}` };
    return;
  }
  ctx.body = dns;
});

rootRouter.get('/locations', async (ctx: Context) => {
  ctx.body = await getLocations();
});

rootRouter.get('/health', (ctx) => {
  ctx.body = 'Ok';
});
