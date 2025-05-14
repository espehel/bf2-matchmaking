import Router from '@koa/router';
import { Context } from 'koa';
import { client } from '@bf2-matchmaking/supabase';
import { del } from '@bf2-matchmaking/redis/generic';
import { hash } from '@bf2-matchmaking/redis/hash';
import { set } from '@bf2-matchmaking/redis/set';
import { json } from '@bf2-matchmaking/redis/json';
import { MatchesJoined } from '@bf2-matchmaking/types';
import { buildLocationsCache } from './cache-service';
import { buildMapsCache, buildRconsCache } from '@bf2-matchmaking/services/cache';

export const cacheRouter = new Router({
  prefix: '/cache',
});

cacheRouter.post('/locations', async (ctx: Context) => {
  const regionIds = await buildLocationsCache();
  await del('cache:locations');
  await set('cache:locations').add(...regionIds);
  ctx.body = regionIds;
});

cacheRouter.get('/locations', async (ctx: Context) => {
  ctx.body = await set('cache:locations').members();
});

cacheRouter.post('/maps', async (ctx: Context) => {
  const mapEntries = await buildMapsCache();
  await hash('cache:maps').set(Object.fromEntries(mapEntries));
  ctx.body = mapEntries;
});

cacheRouter.get('/maps', async (ctx: Context) => {
  ctx.body = await hash('cache:maps').getAll();
});

cacheRouter.post('/rcons', async (ctx: Context) => {
  const rcons = await buildRconsCache();
  ctx.body = await hash('cache:rcons').setEntries(rcons);
});

cacheRouter.get('/rcons', async (ctx: Context) => {
  ctx.body = await hash('cache:rcons').getAll();
});

cacheRouter.post('/matches/:matchid', async (ctx: Context) => {
  const { data: match } = await client().getMatch(ctx.params.matchid);
  ctx.assert(match, 404, 'Live match not found.');
  ctx.body = await json<MatchesJoined>(`matches:${match.id}`).set(match);
});
