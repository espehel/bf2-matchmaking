import Router from '@koa/router';
import { createServerInstance, getInstanceByIp, getRegions, pollInstance } from './vultr';
import { info } from '@bf2-matchmaking/logging';
import { createDnsRecord, getDnsByName } from './cloudflare';
import { Instance } from '@bf2-matchmaking/types/platform';
import { Context } from 'koa';
import { DEFAULTS } from './constants';
import { createServerDns, getDnsRecord, getInstancesByMatchId } from './platform-service';

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
  ctx.assert(name, 400, 'Missing name');
  ctx.assert(region, 400, 'Missing region');
  ctx.assert(match, 400, 'Missing match');
  ctx.assert(subDomain, 400, 'Missing subdomain');

  const dns = await getDnsByName(subDomain);
  if (dns) {
    ctx.throw(409, 'Subdomain already exists');
  }

  const instance = await createServerInstance(
    name,
    region,
    match.toString(),
    map || DEFAULTS.map,
    vehicles === 'true' ? vehicles : ''
  );
  ctx.assert(instance, 500, 'Failed to create server');

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

platformRouter.get('/servers/:ip', async (ctx: Context) => {
  const dns = await getDnsByName(ctx.params.ip);
  const instance = await getInstanceByIp(dns?.content || ctx.params.ip);
  if (!instance) {
    ctx.throw(404, 'Server not found', { dns });
  }
  ctx.body = instance;
});

platformRouter.post('/servers/:ip/dns', async (ctx: Context) => {
  ctx.body = await createServerDns(ctx.params.ip);
});

platformRouter.get('/servers/:id/dns', async (ctx) => {
  ctx.body = await getDnsRecord(ctx.params.id, ctx.query.type);
});

platformRouter.get('/regions', async (ctx: Context) => {
  ctx.body = await getRegions();
});
