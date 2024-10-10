import Router from '@koa/router';
import { runService } from '@bf2-matchmaking/railway';
import {
  buildLocationsCache,
  buildMapsCache,
  buildMatchesCache,
  buildRconsCache,
} from '../cache/cache-service';
import { flush } from '@bf2-matchmaking/redis/generic';
import { hash } from '@bf2-matchmaking/redis/hash';
import { set } from '@bf2-matchmaking/redis/set';
import { logMessage } from '@bf2-matchmaking/logging';
import { json } from '@bf2-matchmaking/redis/json';
import { putMatch } from '@bf2-matchmaking/redis/matches';

const RESTART_TOOL_SERVICE_ID = 'c5633c6e-3e36-4939-b2a6-46658cabd47e';

export const adminRouter = new Router({
  prefix: '/admin',
});

adminRouter.post('/reset', async (ctx) => {
  const [locations, maps, rcons, matches] = await Promise.all([
    buildLocationsCache(),
    buildMapsCache(),
    buildRconsCache(),
    buildMatchesCache(),
  ]);

  const flushResult = await flush();
  const locationsResult = await set('cache:locations').add(...locations);
  const mapsResult = await hash('cache:maps').set(Object.fromEntries(maps));
  await Promise.all(rcons.map((rcon) => json(`rcon:${rcon.id}`).set(rcon)));
  await Promise.all(matches.map((match) => putMatch(match)));

  const matchesCached = matches.length;
  const rconsCached = rcons.length;

  setTimeout(async () => {
    const { deploymentInstanceExecutionCreate } = await runService(
      RESTART_TOOL_SERVICE_ID
    );
    logMessage('System: Resetting system and rebuilding caches', {
      locations,
      locationsResult,
      maps,
      mapsResult,
      rcons,
      matches,
      deploymentInstanceExecutionCreate,
      flushResult,
    });
  }, 500);

  ctx.status = 202;
  ctx.body = {
    message: 'Caches rebuilt, restarting services...',
    flushResult,
    locationsResult,
    mapsResult,
    matchesCached,
    rconsCached,
  };
});
