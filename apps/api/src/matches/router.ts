import Router from '@koa/router';
import { generateMatchUsersXml } from '../players/users-generator';
import { client } from '@bf2-matchmaking/supabase';
import { isConnectedLiveServer, isNotNull } from '@bf2-matchmaking/types/guards';
import { MatchStatus } from '@bf2-matchmaking/types/supabase';
import { PostMatchRequestBody } from '@bf2-matchmaking/types/api';
import { info } from '@bf2-matchmaking/logging';
import { getLiveServer, getLiveServerByMatchId } from '../servers/server-service';
import { createPendingMatch, getMatch } from './match-service';
import { closeMatch } from '@bf2-matchmaking/services/matches';
import { Context } from 'koa';
import { matchKeys } from '@bf2-matchmaking/redis/generic';
import { Match } from '@bf2-matchmaking/services/matches/Match';
import { Server } from '@bf2-matchmaking/services/server/Server';
import { DateTime } from 'luxon';

export const matchesRouter = new Router({
  prefix: '/matches',
});

matchesRouter.post('/close', async (ctx) => {
  const { data: openMatches } = await client().getMatchesWithStatus(MatchStatus.Open);
  if (openMatches && openMatches.length > 0) {
    await client().updateMatches(
      openMatches.map((match) => match.id),
      {
        status: MatchStatus.Deleted,
      }
    );
    info('POST /matches/close', `Soft deleted ${openMatches.length} matches`);
  }
  ctx.body = openMatches;
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
    await Server.reset(match.server.address);
  }
  await Server.setMatch(ctx.request.body.address, ctx.params.matchid);
  ctx.body = await getLiveServer(ctx.request.body.address);
  ctx.status = 200;
});

matchesRouter.post('/:matchid/start', async (ctx: Context) => {
  const { matchid } = ctx.params;
  const { data } = await client().getMatch(parseInt(matchid));
  ctx.assert(data, 404, 'Match does not exist.');

  if (data.status !== MatchStatus.Ongoing) {
    await Match.update(matchid).commit({
      status: MatchStatus.Ongoing,
      started_at: DateTime.now().toISO(),
    });
  }

  await createPendingMatch(data);
  ctx.status = 201;
  ctx.body = await getMatch(matchid);
});

matchesRouter.get('/:matchid/server', async (ctx: Context) => {
  const server = await getLiveServerByMatchId(ctx.params.matchid);
  ctx.assert(server, 404, 'Live match server not found.');

  if (!isConnectedLiveServer(server)) {
    ctx.throw('Match server is not connected.', 500);
  }

  ctx.body = server;
});

matchesRouter.get('/:matchid', async (ctx: Context) => {
  const match = await getMatch(ctx.params.matchid);
  ctx.assert(match, 404, 'Live match not found.');
  ctx.body = match;
});

matchesRouter.get('/', async (ctx) => {
  const keys = await matchKeys('matches:live:*');
  ctx.body = keys.map(getMatch).filter(isNotNull);
});

matchesRouter.post('/', async (ctx: Context) => {
  const { matchValues, matchMaps, matchTeams } = ctx.request.body as PostMatchRequestBody;
  const match = await Match.create(matchValues);
  ctx.body = await Match.update(match.id)
    .setMaps(matchMaps)
    .setTeams(matchTeams)
    .commit();
  ctx.status = 201;
});
