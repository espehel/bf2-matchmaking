import Router from '@koa/router';
import { createServerInstance, getInstanceByIp, getRegions, pollInstance } from './vultr';
import { error, info } from '@bf2-matchmaking/logging';
import { createDnsRecord, getDnsByIp, getDnsByName } from './cloudflare';
import { Instance } from '@bf2-matchmaking/types/platform';
import { Context } from 'koa';
import { DEFAULTS } from './constants';
import { toFetchError } from '@bf2-matchmaking/utils';
import { createServerDns, getDnsRecord, getInstancesByMatchId } from './platform-service';
import { ServiceError } from '@bf2-matchmaking/services/error';
import { deleteServer } from '../servers/server-service';

export const platformRouter = new Router({
  prefix: '/platform',
});

platformRouter.get('/servers', async (ctx: Context) => {
  ctx.body = await getInstancesByMatchId(ctx.query.match);
});

interface ServersRequestBody extends Omit<Request, 'body'> {
  name?: string;
  region?: string;
  match?: string | number;
  map?: string;
  vehicles?: string;
  subDomain?: string;
}
platformRouter.post('/servers', async (ctx: Context) => {
  const { name, region, match, map, vehicles, subDomain } = <ServersRequestBody>(
    ctx.request.body
  );
  if (!name || !region || !match || !subDomain) {
    ctx.status = 400;
    ctx.body = { message: 'Missing name, region, match, map, subdomain or vehicles' };
    return;
  }
  const dns = await getDnsByName(subDomain);
  if (dns) {
    ctx.status = 409;
    ctx.body = { message: 'Subdomain already exists' };
    return;
  }

  const instance = await createServerInstance(
    name,
    region,
    match.toString(),
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
      await createDnsRecord(subDomain, instance.main_ip);
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

platformRouter.get('/servers/:ip', async (ctx) => {
  const dns = await getDnsByName(ctx.params.ip);
  const instance = await getInstanceByIp(dns?.content || ctx.params.ip);
  if (!instance) {
    error(
      'GET /servers/:ip',
      `Server ${ctx.params.ip} not found {content: "${dns?.content}", name: "${dns?.name}"}`
    );
    ctx.status = 404;
    ctx.body = { message: 'Server not found' };
    return;
  }
  ctx.body = instance;
});
platformRouter.delete('/servers/:ip', async (ctx: Context) => {
  try {
    ctx.body = await deleteServer(ctx.params.ip);
  } catch (e) {
    if (e instanceof ServiceError) {
      ctx.status = e.status;
      ctx.body = { message: e.message };
    } else {
      ctx.status = 500;
      ctx.body = toFetchError(e);
    }
  }
});

platformRouter.post('/servers/:ip/dns', async (ctx: Context) => {
  try {
    ctx.body = await createServerDns(ctx.params.ip);
  } catch (e) {
    if (e instanceof ServiceError) {
      ctx.status = e.status;
      ctx.body = { message: e.message };
    } else {
      ctx.status = 500;
      ctx.body = toFetchError(e);
    }
  }
});

platformRouter.get('/servers/:ip/dns', async (ctx) => {
  try {
    ctx.body = await getDnsRecord(ctx.params.ip);
  } catch (e) {
    if (e instanceof ServiceError) {
      ctx.status = e.status;
      ctx.body = { message: e.message };
    } else {
      ctx.status = 500;
      ctx.body = toFetchError(e);
    }
  }
});

platformRouter.get('/regions', async (ctx: Context) => {
  ctx.body = await getRegions();
});
