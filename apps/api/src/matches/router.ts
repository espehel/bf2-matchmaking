import Router from '@koa/router';
import { generateMatchUsersXml } from '../players/users-generator';
import { client } from '@bf2-matchmaking/supabase';
import { isConnectedLiveServer, isNotNull } from '@bf2-matchmaking/types/guards';
import { MatchStatus } from '@bf2-matchmaking/types/supabase';
import { info } from '@bf2-matchmaking/logging';
import { getLiveServer, getLiveServerByMatchId } from '../servers/server-service';
import { createPendingMatch, getLiveMatch, verifyServer } from './match-service';
import { Context } from 'koa';
import { matchKeys } from '@bf2-matchmaking/redis/generic';
import { Server } from '@bf2-matchmaking/services/server/Server';
import { DateTime } from 'luxon';
import {
  getMatchLogsResponseSchema,
  matchesPostRequestBodySchema,
} from '@bf2-matchmaking/services/schemas/matches.ts';
import { stream } from '@bf2-matchmaking/redis/stream';
import { matchApi, matchService } from '../lib/match';
import { protect } from '../auth.ts';

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

matchesRouter.get('/:id/users.xml', async (ctx: Context): Promise<void> => {
  const { data: match } = await client().getMatch(Number(ctx.params.id));
  ctx.assert(match, 404, 'Match not found.');

  ctx.set('Content-Type', 'text/xml');
  ctx.body = generateMatchUsersXml(match);
});

matchesRouter.post('/:matchid/results', async (ctx: Context): Promise<void> => {
  const { data } = await client().getMatch(parseInt(ctx.params.matchid));
  ctx.assert(data, 404, 'Match not found.');

  if (data.status !== MatchStatus.Finished) {
    ctx.throw(400, 'Match is not finished.');
  }

  const { results, errors } = await matchService.closeMatch(data);

  if (errors) {
    ctx.throw(400, errors.join(', '), errors);
  }

  ctx.status = 201;
  ctx.body = results;
});

matchesRouter.post('/:matchid/server', async (ctx: Context): Promise<void> => {
  const force = `${ctx.query.force}`.toLowerCase() === 'true';

  const match = await getLiveMatch(ctx.params.matchid);
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

matchesRouter.post('/:matchid/start', protect('user'), async (ctx: Context) => {
  const { matchid } = ctx.params;
  const { address } = ctx.request.body;
  const { data } = await client().getMatch(parseInt(matchid));
  ctx.assert(data, 404, 'Match does not exist.');

  if (data.status !== MatchStatus.Ongoing) {
    await matchApi.update(matchid).commit({
      status: MatchStatus.Ongoing,
      started_at: DateTime.now().toISO(),
    });
  }

  await createPendingMatch(data);
  const server = await verifyServer(address);
  ctx.assert(server, 400, 'Failed to get server data');

  await Server.setMatch(address, matchid);

  matchApi.log(matchid, `Started on ${address} by ${ctx.request.user?.nick || 'system'}`);

  ctx.status = 201;
  ctx.body = await getLiveMatch(matchid);
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
  const match = await getLiveMatch(ctx.params.matchid);
  ctx.assert(match, 404, 'Live match not found.');
  ctx.body = match;
});

matchesRouter.get('/', async (ctx) => {
  const keys = await matchKeys('matches:live:*');
  ctx.body = keys.map(getLiveMatch).filter(isNotNull);
});

matchesRouter.post('/', async (ctx: Context) => {
  const { matchValues, matchMaps, matchTeams, matchDraft, servers } =
    matchesPostRequestBodySchema.parse(ctx.request.body);
  const match = await matchApi.create(matchValues);
  ctx.body = await matchApi
    .update(match.id)
    .setMaps(matchMaps)
    .setTeams(matchTeams)
    .setDraft(matchDraft)
    .setServers(servers)
    .commit();
  ctx.status = 201;
});

matchesRouter.get('/:id/log', async (ctx: Context) => {
  const streamMessages = await stream(`matches:${ctx.params.id}:log`).readAll(true);
  ctx.body = streamMessages.map(({ message }) => message);
  getMatchLogsResponseSchema.parse(ctx.body);
});
