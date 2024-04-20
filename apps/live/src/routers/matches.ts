import Router from '@koa/router';
import {
  findLiveMatch,
  getLiveMatches,
  startLiveMatch,
} from '../services/match/MatchManager';
import { client } from '@bf2-matchmaking/supabase';
import { MatchStatus } from '@bf2-matchmaking/types';
import { closeMatch, toLiveMatch } from '../services/match/matches';
import { info } from '@bf2-matchmaking/logging';
import { getLiveServer, resetLiveMatchServers } from '../services/server/ServerManager';

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

  const liveMatch = findLiveMatch(Number(ctx.params.matchid));
  if (!liveMatch) {
    ctx.status = 404;
    ctx.body = { message: 'Live match not found.' };
    return;
  }

  const liveServer = getLiveServer(ctx.request.body.address);
  if (!liveServer) {
    ctx.status = 404;
    ctx.body = { message: 'Live server not found' };
    return;
  }

  if (liveMatch.state !== 'pending' && !force) {
    ctx.status = 400;
    ctx.body = { message: `Live match has not started.` };
    return;
  }

  if (!liveServer.isIdle() && !force) {
    ctx.status = 400;
    ctx.body = { message: `Live server is already in use.` };
    return;
  }

  if ((!liveServer.isIdle() || liveMatch.state !== 'pending') && force) {
    info(
      'postMatchLiveServer',
      `Forcefully set live server ${ctx.request.body.address} to match ${liveMatch.match.id}`
    );
  }

  resetLiveMatchServers(liveMatch);
  liveServer.reset();
  liveServer.setLiveMatch(liveMatch);
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

  const liveMatch = startLiveMatch(data);
  ctx.status = 201;
  ctx.body = liveMatch;
});

matchesRouter.get('/:matchid/server', async (ctx) => {
  const match = findLiveMatch(Number(ctx.params.matchid));
  if (!match) {
    ctx.status = 404;
    ctx.body = { message: 'Live match not found.' };
    return;
  }
  ctx.body = match.server;
});

matchesRouter.get('/:matchid', async (ctx) => {
  const match = findLiveMatch(Number(ctx.params.matchid));

  if (!match) {
    ctx.status = 404;
    ctx.body = { message: 'Live match not found.' };
    return;
  }

  ctx.body = toLiveMatch(match);
});

matchesRouter.get('/', async (ctx) => {
  ctx.body = getLiveMatches().map(toLiveMatch);
});
