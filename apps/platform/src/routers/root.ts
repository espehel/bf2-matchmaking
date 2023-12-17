import Router from '@koa/router';
import {
  createServerInstance,
  deleteServerInstance,
  deleteStartupScript,
  getInstanceByIp,
  getLocations,
  getServerInstance,
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
import { api, verify } from '@bf2-matchmaking/utils';
import { saveDemos } from '../services/demos';
import { isString } from '@bf2-matchmaking/types';

export const rootRouter = new Router();

rootRouter.get('/servers', async (ctx: Context) => {
  if (isString(ctx.query.ip)) {
    const instance = await getInstanceByIp(ctx.query.ip);
    ctx.assert(instance, 404);
    ctx.body = instance;
    return;
  }
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
rootRouter.delete('/servers/:id', async (ctx: Context) => {
  const instance = await getServerInstance(ctx.params.id);
  ctx.assert(instance, 404, 'Server not found');
  const dns = await getDnsByName(instance.tag);
  ctx.assert(dns, 502, 'DNS not found');

  const { data: si } = await api.rcon().getServerInfo(dns.name);
  if (si && Number(si.connectedPlayers) > 1) {
    ctx.status = 409;
    ctx.body = { message: 'Server is not empty' };
    return;
  }

  await saveDemos(dns.name);

  await Promise.all([
    await deleteServerInstance(instance.id),
    await deleteStartupScript(instance.label),
    await api.rcon().deleteServerLive(dns.name),
  ]);

  if (dns) {
    await deleteDnsRecord(dns.id);
  }

  info(
    'DELETE /servers',
    `Instance ${dns.name} deleted. [id: "${instance.id}", dns content: "${dns?.content}", tag: "${instance.tag}", label: "${instance.label}"]`
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

rootRouter.get('/locations', async (ctx: Context) => {
  ctx.body = await getLocations();
});

rootRouter.get('/health', (ctx) => {
  ctx.body = 'Ok';
});
