import Router from '@koa/router';
import { error, info } from '@bf2-matchmaking/logging';
import {
  createSocket,
  exec,
  getMapList,
  getPlayerList,
  getServerInfo,
  pauseRound,
  restartServer,
  unpauseRound,
  verifyRconResult,
} from '@bf2-matchmaking/services/rcon';
import { restartWithInfantryMode, restartWithVehicleMode } from './http-api';
import { hash } from '@bf2-matchmaking/redis/hash';
import {
  createPendingServer,
  getAddress,
  getAdmins,
  getLiveServer,
  getLiveServers,
  upsertServer,
} from './server-service';
import { updateLiveServer } from '@bf2-matchmaking/services/server';
import { Context } from 'koa';
import { protect } from '../auth';
import { PostRestartServerRequestBody, ServerRconsRow } from '@bf2-matchmaking/types';
import { deleteInstance } from '../platform/platform-service';
import { client } from '@bf2-matchmaking/supabase';
import { Server } from '@bf2-matchmaking/services/server/Server';
import { stream } from '@bf2-matchmaking/redis/stream';
import { getAllServers } from '@bf2-matchmaking/redis/servers';
import { ServerLogEntry } from '@bf2-matchmaking/types/server';

export const serversRouter = new Router({
  prefix: '/servers',
});

serversRouter.get('/rcons', protect(), async (ctx) => {
  const servers = await getLiveServers();
  const rcons = await hash<Record<string, string>>('cache:rcons').getAll();
  ctx.body = servers.map<ServerRconsRow>((s) => ({
    id: s.address,
    rcon_pw: rcons[s.address],
    rcon_port: 4711,
    created_at: '',
  }));
});

serversRouter.get('/logs', async (ctx: Context) => {
  const servers = await getAllServers();
  ctx.body = await Promise.all(
    servers.map(async (server) => {
      const streamMessages = await stream(`servers:${server}:log`).readAll(true);
      return [
        server,
        streamMessages.map(({ message }) => message as unknown as ServerLogEntry),
      ];
    })
  );
});

serversRouter.get('/:address/log', async (ctx: Context) => {
  const streamMessages = await stream(`servers:${ctx.params.address}:log`).readAll();
  ctx.body = streamMessages.map(({ message }) => message);
});

serversRouter.post('/:ip/restart', protect(), async (ctx: Context) => {
  const { mode, mapName, serverName, admins } = ctx.request
    .body as PostRestartServerRequestBody;

  const usersxml = await getAdmins(admins);

  if (mode === 'infantry') {
    const result = await restartWithInfantryMode(
      ctx.params.ip,
      usersxml,
      mapName,
      serverName
    );
    if (result.error && result.error.message !== 'Unexpected end of JSON input') {
      error('api/servers/:ip/restart', result.error);
      ctx.throw(502, 'Could not restart server with infantry mode', { result });
    }
  }
  if (mode === 'vehicles') {
    const result = await restartWithVehicleMode(
      ctx.params.ip,
      usersxml,
      mapName,
      serverName
    );
    if (result.error && result.error.message !== 'Unexpected end of JSON input') {
      error('api/servers/:ip/restart', result.error);
      ctx.throw(502, 'Could not restart server with vehicles mode', { result });
    }
  }
  if (!mode) {
    const result = await restartServer(ctx.params.ip);
    if (result.error && result.error.message !== 'Unexpected end of JSON input') {
      error('api/servers/:ip/restart', result.error);
      ctx.throw(502, 'Could not restart server with default mode', { result });
    }
  }
  ctx.body = await Server.restart(ctx.params.ip);
  ctx.status = 202;
});

serversRouter.post('/:ip/players/switch', async (ctx) => {
  ctx.body = { message: 'Not implemented' };
  ctx.status = 501;
});

serversRouter.post('/:ip/maps', async (ctx: Context) => {
  const map = await hash<Record<string, string>>('cache:maps').get(
    ctx.request.body.map.toString()
  );
  ctx.assert(map, 404, 'Could not find map');

  const { data: mapList } = await getMapList(ctx.params.ip);
  ctx.assert(mapList, 502, 'Could not get map list from server');

  const id = mapList.indexOf(map);

  await exec(ctx.params.ip, `admin.setNextLevel ${id}`).then(verifyRconResult);
  await exec(ctx.params.ip, 'admin.runNextLevel').then(verifyRconResult);

  const info = await getServerInfo(ctx.params.ip).then(verifyRconResult);

  ctx.body = { currentMapName: info.currentMapName, nextMapName: info.nextMapName };
});

serversRouter.post('/:ip/exec', async (ctx: Context) => {
  const { cmd } = ctx.request.body;
  ctx.assert(cmd, 400, 'Missing cmd');
  ctx.body = await exec(ctx.params.ip, cmd).then(verifyRconResult);
});

serversRouter.post('/:ip/unpause', async (ctx) => {
  await unpauseRound(ctx.params.ip).then(verifyRconResult);
  ctx.status = 204;
});
serversRouter.post('/:ip/pause', async (ctx) => {
  await pauseRound(ctx.params.ip).then(verifyRconResult);
  ctx.status = 204;
});

serversRouter.get('/:ip/pl', async (ctx) => {
  ctx.body = await getPlayerList(ctx.params.ip).then(verifyRconResult);
});

serversRouter.get('/:ip/si', async (ctx: Context) => {
  ctx.body = await getServerInfo(ctx.params.ip).then(verifyRconResult);
});

serversRouter.delete('/:address', async (ctx) => {
  const { address } = ctx.params;
  const server = await client().deleteServer(address);
  const rcon = await client().deleteServerRcon(address);
  const instance = await deleteInstance(address).catch((e) => e);
  const redis = await Server.delete(address).catch((e) => e);
  ctx.status = 200;
  ctx.body = { server, rcon, instance, redis };
});

serversRouter.post('/', async (ctx: Context): Promise<void> => {
  const { ip, port, rcon_pw, demo_path } = ctx.request.body;
  const rcon_port = Number(ctx.request.body.rcon_port);
  ctx.assert(rcon_port, 400, 'Missing rcon_port');
  ctx.assert(ip, 400, 'Missing ip');
  ctx.assert(port, 400, 'Missing port');
  ctx.assert(rcon_pw, 400, 'Missing rcon_pw');

  const address = await getAddress(ip);
  const isResolvingDns = address === ip;
  await hash('cache:rcons').setEntries([[address, rcon_pw]]);
  const socket = createSocket(address, rcon_pw);

  if (!socket && isResolvingDns) {
    createPendingServer(
      {
        address,
        port,
        rcon_port,
        rcon_pw,
        demo_path: demo_path || `http://${address}/demos`,
      },
      0
    );
    ctx.status = 202;
    ctx.body = null;
    return;
  }
  const { data: serverInfo } = await getServerInfo(address);
  ctx.assert(serverInfo, 502, 'Failed to connect to server.');

  const server = await upsertServer(
    address,
    port,
    rcon_port,
    rcon_pw,
    serverInfo,
    demo_path
  );
  info('routes/servers', `Upserted server ${address} with name ${serverInfo.serverName}`);

  const liveServer = Server.init(server);
  ctx.assert(liveServer, 502, 'Failed to create live server');

  ctx.body = liveServer;
});

serversRouter.get('/:ip', async (ctx: Context) => {
  await updateLiveServer(ctx.params.ip, true);
  const server = await getLiveServer(ctx.params.ip);
  ctx.assert(server, 404, 'Live server not found');
  ctx.body = server;
});

serversRouter.get('/', async (ctx) => {
  ctx.body = await getLiveServers();
});
