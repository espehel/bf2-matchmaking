import Router from '@koa/router';
import {
  createServerInstance,
  deleteServerInstance,
  deleteStartupScript,
  getInstanceByIp,
  getRegions,
  getServerInstances,
  pollInstance,
} from '../services/vultr';
import { error, info } from '@bf2-matchmaking/logging';
import {
  createDnsRecord,
  deleteDnsRecord,
  getDnsByIp,
  getDnsByName,
} from '../services/cloudflare';
import { Instance } from '@bf2-matchmaking/types/src/vultr';
import { Context } from 'koa';
import { DEFAULTS } from '../constants';
import { api } from '@bf2-matchmaking/utils';
import { saveDemosAll } from '@bf2-matchmaking/demo';

export const rootRouter = new Router();

rootRouter.get('/servers', async (ctx: Context) => {
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
rootRouter.post('/servers', async (ctx: Context) => {
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

rootRouter.get('/servers/:ip', async (ctx) => {
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
rootRouter.delete('/servers/:ip', async (ctx: Context) => {
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

  await saveDemosAll(host);

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
  const dns = await getDnsByIp(ctx.params.ip);
  if (!dns) {
    ctx.status = 400;
    ctx.body = { message: `Could not find DNS record for ${ctx.params.ip}` };
    return;
  }
  ctx.body = dns;
});

rootRouter.get('/regions', async (ctx: Context) => {
  ctx.body = await getRegions();
});

rootRouter.get('/health', (ctx) => {
  ctx.body = 'Ok';
});
