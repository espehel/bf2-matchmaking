import Router from '@koa/router';
import { restartServiceByName, runService } from '@bf2-matchmaking/railway';
import { buildLocationsCache } from '../cache/cache-service';
import { flush, save } from '@bf2-matchmaking/redis/generic';
import { hash } from '@bf2-matchmaking/redis/hash';
import { set } from '@bf2-matchmaking/redis/set';
import { logMessage } from '@bf2-matchmaking/logging';
import { putMatch } from '@bf2-matchmaking/redis/matches';
import { DateTime } from 'luxon';
import { protect } from '../auth';
import { Gather } from '@bf2-matchmaking/services/gather';
import { resetServers } from '@bf2-matchmaking/services/server';
import {
  buildMapsCache,
  buildMatchesCache,
  buildRconsCache,
} from '@bf2-matchmaking/services/cache';

const RESTART_TOOL_SERVICE_ID = 'c5633c6e-3e36-4939-b2a6-46658cabd47e';

export const adminRouter = new Router({
  prefix: '/admin',
});

adminRouter.post('/reset/engine', protect(), async (ctx) => {
  const [gatherResult, serviceResult] = await Promise.all([
    Gather(20).del(),
    restartServiceByName('engine'),
  ]);
  ctx.body = {
    ...gatherResult,
    ...serviceResult,
  };
});

adminRouter.post('/reset/servers', protect(), async (ctx) => {
  ctx.body = await resetServers();
});

adminRouter.post('/reset', protect(), async (ctx) => {
  const [locations, maps, rcons, matches] = await Promise.all([
    buildLocationsCache(),
    buildMapsCache(),
    buildRconsCache(),
    buildMatchesCache(),
  ]);

  const flushResult = await flush();
  const locationsResult = await set('cache:locations').add(...locations);
  const mapsResult = await hash('cache:maps').setEntries(maps);
  const rconsResult = await hash('cache:rcons').setEntries(rcons);
  await Promise.all(matches.map((match) => putMatch(match)));

  await hash('system').set({ resetAt: DateTime.now().toISO() });

  setTimeout(async () => {
    await save();
    const { deploymentInstanceExecutionCreate } = await runService(
      RESTART_TOOL_SERVICE_ID
    );
    logMessage('System: Resetting system and rebuilding caches', {
      locations,
      locationsResult,
      maps,
      mapsResult,
      rcons: rcons.map((entry) => entry[0]),
      rconsResult,
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
    rconsResult,
    matchesCached: matches.length,
  };
});
