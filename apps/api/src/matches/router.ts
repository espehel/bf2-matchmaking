import Router from '@koa/router';
import { generateMatchUsersXml } from './users-generator';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { isNotNull, MatchStatus } from '@bf2-matchmaking/types';
import { info } from '@bf2-matchmaking/logging';
import { addActiveMatchServer } from '@bf2-matchmaking/redis/servers';
import {
  getMatchesLive,
  getMatchLive,
  getMatchLiveSafe,
} from '@bf2-matchmaking/redis/matches';
import {
  getLiveServer,
  getLiveServerByMatchId,
  resetLiveServer,
} from '../servers/server-service';
import { createPendingMatch, getMatch } from './match-service';
import { closeMatch } from '@bf2-matchmaking/services/matches';
import { Context } from 'koa';
import { ServiceError } from '@bf2-matchmaking/services/error';

export const matchesRouter = new Router({
  prefix: '/matches',
});

matchesRouter.get('/:id/users.xml', async (ctx: Context) => {
  const { data: match } = await client().getMatch(Number(ctx.params.id));
  ctx.assert(match, 404, 'Match not found.');

  ctx.set('Content-Type', 'text/xml');
  ctx.body = generateMatchUsersXml(match);
});

matchesRouter.post('/:matchid/results', async (ctx: Context) => {
  const { data } = await client().getMatch(parseInt(ctx.params.matchid));
  ctx.assert(data, 404, 'Match not found.');

  if (data.status !== MatchStatus.Finished) {
    ctx.throw(400, 'Match is not finished.');
  }

  const { results, errors } = await closeMatch(data);

  if (errors) {
    ctx.throw(400, errors.join(', '), errors);
  }

  ctx.status = 201;
  ctx.body = results;
});

matchesRouter.post('/:matchid/server', async (ctx: Context) => {
  const force = `${ctx.query.force}`.toLowerCase() === 'true';

  const match = await getMatch(ctx.params.matchid);
  ctx.assert(match, 404, 'Live match not found.');

  const liveServer = await getLiveServer(ctx.request.body.address);
  ctx.assert(liveServer, 404, 'Live server not found.');

  if (match.state !== 'pending' && !force) {
    ctx.throw(400, 'Live match has started.');
  }

  if (liveServer.status !== 'idle' && !force) {
    ctx.throw(400, `Live server is already in use.`);
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

matchesRouter.post('/:matchid', async (ctx: Context) => {
  const { data } = await client().getMatch(parseInt(ctx.params.matchid));
  ctx.assert(data, 404, 'Match does not exist.');

  if (data.status !== MatchStatus.Ongoing) {
    ctx.throw(400, `Match ${data.id} is not ongoing.`);
  }

  const liveMatch = await createPendingMatch(data);
  ctx.status = 201;
  ctx.body = liveMatch;
});

matchesRouter.get('/:matchid/server', async (ctx: Context) => {
  const server = await getLiveServerByMatchId(ctx.params.matchid);
  ctx.assert(server, 404, 'Live match server not found.');
  ctx.body = server;
});

matchesRouter.get('/:matchid', async (ctx: Context) => {
  const match = await getMatchLiveSafe(ctx.params.matchid);
  ctx.assert(match, 404, 'Live match not found.');
  ctx.body = match;
});

matchesRouter.get('/', async (ctx) => {
  const matches = await getMatchesLive();
  ctx.body = matches.map(getMatchLive).filter(isNotNull);
});
