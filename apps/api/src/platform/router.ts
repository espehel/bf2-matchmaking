import Router from '@koa/router';
import {
  createServerInstance,
  deleteServerInstance,
  deleteStartupScript,
  getInstanceByIp,
  getRegions,
  getServerInstances,
  pollInstance,
} from './vultr';
import { error, info } from '@bf2-matchmaking/logging';
import { createDnsRecord, deleteDnsRecord, getDnsByIp, getDnsByName } from './cloudflare';
import { Instance } from '@bf2-matchmaking/types/platform';
import { Context } from 'koa';
import { DEFAULTS } from './constants';
import { api, toFetchError } from '@bf2-matchmaking/utils';
import { createServerDns } from './platform-service';
import { ServiceError } from '@bf2-matchmaking/services/error';

export const platformRouter = new Router({
  prefix: '/platform',
});

platformRouter.get('/servers', async (ctx: Context) => {
  const { match } = ctx.query;
  ctx.body = await getServerInstances(match);
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
  const dns = await getDnsByName(ctx.params.ip);
  const instance = await getInstanceByIp(dns?.content || ctx.params.ip);

  if (!instance) {
    error(
      'DELETE /servers/:ip',
      `Server ${ctx.params.ip} not found {content: "${dns?.content}", name: "${dns?.name}"}`
    );
    ctx.status = 404;
    ctx.body = { message: 'Server not found' };
    return;
  }

  const host = dns?.name || ctx.params.ip;

  const { data: si } = await api.live().getServerInfo(host);
  if (si && Number(si.connectedPlayers) > 3) {
    ctx.status = 409;
    ctx.body = { message: 'Server is not empty' };
    return;
  }

  // TODO fix: could use vercel blob + redis stream
  //await saveDemosAll(host);

  await Promise.all([
    await deleteServerInstance(instance.id),
    await deleteStartupScript(instance.label),
    await api.live().deleteServer(host),
  ]);

  if (dns) {
    await deleteDnsRecord(dns.id);
  }

  info(
    'DELETE /servers/:ip',
    `Instance ${host} deleted. [id: "${instance.id}", dns content: "${dns?.content}", tag: "${instance.tag}", label: "${instance.label}"]`
  );
  ctx.status = 200;
  ctx.body = instance;
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
  const dns = await getDnsByIp(ctx.params.ip);
  if (!dns) {
    ctx.status = 400;
    ctx.body = { message: `Could not find DNS record for ${ctx.params.ip}` };
    return;
  }
  ctx.body = dns;
});

platformRouter.get('/regions', async (ctx: Context) => {
  ctx.body = await getRegions();
});
