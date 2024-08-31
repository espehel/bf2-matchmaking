import Router from '@koa/router';
import { client } from '@bf2-matchmaking/supabase';
import { isNotNull, MatchStatus } from '@bf2-matchmaking/types';
import { closeMatch } from '../services/match/matches';
import { info } from '@bf2-matchmaking/logging';
import { addActiveMatchServer, getActiveMatches } from '@bf2-matchmaking/redis';
import {
  getLiveServer,
  getLiveServerByMatchId,
  resetLiveServer,
} from '../services/server/server-manager';
import { createPendingMatch, getMatch } from '../services/match/match-manager';

export const matchesRouter = new Router({
  prefix: '/matches',
});

matchesRouter.post('/:matchid/results', async (ctx) => {
  const { data } = await client().getMatch(parseInt(ctx.params.matchid));

  if (!data) {
    ctx.status = 400;
    ctx.body = { message: 'Match does not exist.' };
    return;
  }
  if (data.status !== MatchStatus.Finished) {
    ctx.status = 400;
    ctx.body = { message: 'Match is not finished.' };
    return;
  }

  const { results, errors } = await closeMatch(data);

  if (errors) {
    ctx.status = 400;
    ctx.body = { message: errors.join(', ') };
    return;
  }

  ctx.status = 201;
  ctx.body = results;
});

matchesRouter.post('/:matchid/server', async (ctx) => {
  const force = `${ctx.query.force}`.toLowerCase() === 'true';

  const match = await getMatch(ctx.params.matchid);
  if (!match) {
    ctx.status = 404;
    ctx.body = { message: 'Live match not found.' };
    return;
  }

  const liveServer = await getLiveServer(ctx.request.body.address);
  if (!liveServer) {
    ctx.status = 404;
    ctx.body = { message: 'Live server not found' };
    return;
  }

  if (match.state !== 'pending' && !force) {
    ctx.status = 400;
    ctx.body = { message: `Live match has started.` };
    return;
  }

  if (liveServer.status !== 'idle' && !force) {
    ctx.status = 400;
    ctx.body = { message: `Live server is already in use.` };
    return;
  }

  if ((liveServer.status !== 'idle' || match.state !== 'pending') && force) {
    info(
      'postMatchLiveServer',
      `Forcefully set live server ${ctx.request.body.address} to match ${ctx.params.matchid}`
    );
  }

  if (match.server) {
    await resetLiveServer(match.server.address);
  }
  await addActiveMatchServer(ctx.request.body.address, ctx.params.matchid);
  ctx.status = 204;
});

matchesRouter.post('/:matchid', async (ctx) => {
  const { data } = await client().getMatch(parseInt(ctx.params.matchid));

  if (!data) {
    ctx.status = 400;
    ctx.body = { message: 'Match does not exist.' };
    return;
  }

  if (data.status !== MatchStatus.Ongoing) {
    ctx.status = 400;
    ctx.body = { message: `Match ${data.id} is not ongoing.` };
    return;
  }

  const liveMatch = await createPendingMatch(data);
  ctx.status = 201;
  ctx.body = liveMatch;
});

matchesRouter.get('/:matchid/server', async (ctx) => {
  const server = await getLiveServerByMatchId(ctx.params.matchid);
  if (!server) {
    ctx.status = 404;
    ctx.body = { message: 'Live match server not found.' };
    return;
  }
  ctx.body = server;
});

matchesRouter.get('/:matchid', async (ctx) => {
  const match = await getMatch(ctx.params.matchid);

  if (!match) {
    ctx.status = 404;
    ctx.body = { message: 'Live match not found.' };
    return;
  }

  ctx.body = match;
});

matchesRouter.get('/', async (ctx) => {
  const matches = await getActiveMatches();
  ctx.body = matches.map(getMatch).filter(isNotNull);
});
