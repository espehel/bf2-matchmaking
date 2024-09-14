import Router from '@koa/router';
import { getRegions } from '../platform/vultr';
import { Context } from 'koa';
import { client, verifyResult } from '@bf2-matchmaking/supabase';
import { del } from '@bf2-matchmaking/redis/generic';
import { hash } from '@bf2-matchmaking/redis/hash';
import { set } from '@bf2-matchmaking/redis/set';
import { json } from '@bf2-matchmaking/redis/json';
import { ServerRconsRow } from '@bf2-matchmaking/types';

export const cacheRouter = new Router({
  prefix: '/cache',
});

cacheRouter.post('/locations', async (ctx: Context) => {
  const regions = await getRegions();
  const regionIds = regions.map(({ id }) => id);
  await del('cache:locations');
  await set('cache:locations').add(...regionIds);
  ctx.body = regionIds;
});

cacheRouter.get('/locations', async (ctx: Context) => {
  ctx.body = await set('cache:locations').members();
});

cacheRouter.post('/maps', async (ctx: Context) => {
  const maps = await client().getMaps().then(verifyResult);
  const mapEntries = maps.map((map) => [
    map.id.toString(),
    map.name.toLowerCase().replace(/ /g, '_'),
  ]);
  await hash('cache:maps').set(Object.fromEntries(mapEntries));
  ctx.body = mapEntries;
});

cacheRouter.get('/maps', async (ctx: Context) => {
  ctx.body = await hash('cache:maps').getAll();
});

cacheRouter.post('/rcons', async (ctx: Context) => {
  const servers = await client().getServers().then(verifyResult);
  for (const server of servers) {
    if (server.rcon) {
      await json<ServerRconsRow>(`rcon:${server.ip}`).set(server.rcon);
    }
  }
  ctx.body = 'OK';
});
