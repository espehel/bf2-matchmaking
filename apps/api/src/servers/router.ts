import Router from '@koa/router';
import { error, info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
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
import {
  restartWithInfantryMode,
  restartWithProfile,
  restartWithVehicleMode,
} from './http-api';
import { hash } from '@bf2-matchmaking/redis/hash';
import {
  buildServerProfile,
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
import { ServerApi } from '@bf2-matchmaking/services/server/Server';
import { stream } from '@bf2-matchmaking/redis/stream';
import { getAllServers } from '@bf2-matchmaking/redis/servers';
import { ServerLogEntry } from '@bf2-matchmaking/types/server';
import { serverGetProfileXmlQueriesSchema } from '@bf2-matchmaking/services/schemas/servers.ts';
import { generateProfileXml } from './profile-generator';
import { ServerInfoStream } from './ServerInfoStream';
import { addClient, removeClient } from './server-info-broadcaster';

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
  const streamMessages = await stream(`servers:${ctx.params.address}:log`).readAll(true);
  ctx.body = streamMessages.map(({ message }) => message);
});

serversRouter.post('/:ip/restart', protect('user'), async (ctx: Context) => {
  const { mode, mapName, serverName, admins, pubobotMatchId } = ctx.request
    .body as PostRestartServerRequestBody;

  const usersxml = await getAdmins(admins);

  const serverProfile = await buildServerProfile(ctx.params.ip, pubobotMatchId);
  if (serverProfile) {
    const result = await restartWithProfile(ctx.params.ip, serverProfile, usersxml);
    logMessage(`Server ${ctx.params.ip}: Restarting with server profile`, {
      body: ctx.request.body,
      serverProfile,
      result,
    });
    if (result.error && result.error.message !== 'Unexpected end of JSON input') {
      error('api/servers/:ip/restart', result.error);
      ctx.throw(502, 'Could not restart server with infantry mode', { result });
    }
  } else if (mode === 'infantry') {
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
  } else if (mode === 'vehicles') {
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
  } else {
    const result = await restartServer(ctx.params.ip);
    if (result.error && result.error.message !== 'Unexpected end of JSON input') {
      error('api/servers/:ip/restart', result.error);
      ctx.throw(502, 'Could not restart server with default mode', { result });
    }
  }
  ctx.body = await ServerApi.restart(ctx.params.ip);
  if (ctx.request.user) {
    stream(`servers:${ctx.params.ip}:log`)
      .log(`Server restarted with mode ${mode} by ${ctx.request.user.nick}`, 'info')
      .catch((e) =>
        logErrorMessage(`Server ${ctx.params.ip}: Error logging server message`, e)
      );
  }
  ctx.status = 202;
});

serversRouter.post('/:ip/players/switch', async (ctx) => {
  ctx.body = { message: 'Not implemented' };
  ctx.status = 501;
});

serversRouter.post('/:ip/maps', protect('user'), async (ctx: Context) => {
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
  if (ctx.request.user) {
    stream(`servers:${ctx.params.ip}:log`)
      .log(`Server map changed to ${map} by ${ctx.request.user.nick}`, 'info')
      .catch((e) =>
        logErrorMessage(`Server ${ctx.params.ip}: Error logging server message`, e)
      );
  }
  ctx.body = { currentMapName: info.currentMapName, nextMapName: info.nextMapName };
});

serversRouter.post('/:ip/exec', protect('user'), async (ctx: Context) => {
  const { cmd } = ctx.request.body;
  ctx.assert(cmd, 400, 'Missing cmd');
  if (cmd === 'admin.restartMap' && ctx.request.user) {
    stream(`servers:${ctx.params.ip}:log`)
      .log(`Map restarted by ${ctx.request.user.nick}`, 'info')
      .catch((e) =>
        logErrorMessage(`Server ${ctx.params.ip}: Error logging server message`, e)
      );
  }
  ctx.body = await exec(ctx.params.ip, cmd).then(verifyRconResult);
  if (cmd === 'quit' && ctx.request.user) {
    stream(`servers:${ctx.params.ip}:log`)
      .log(`Server restarted by ${ctx.request.user.nick}`, 'info')
      .catch((e) =>
        logErrorMessage(`Server ${ctx.params.ip}: Error logging server message`, e)
      );
  }
});

serversRouter.post('/:ip/unpause', protect('user'), async (ctx) => {
  await unpauseRound(ctx.params.ip).then(verifyRconResult);
  if (ctx.request.user) {
    stream(`servers:${ctx.params.ip}:log`)
      .log(`Server unpaused by ${ctx.request.user.nick}`, 'info')
      .catch((e) =>
        logErrorMessage(`Server ${ctx.params.ip}: Error logging server message`, e)
      );
  }
  ctx.status = 204;
});
serversRouter.post('/:ip/pause', protect('user'), async (ctx) => {
  await pauseRound(ctx.params.ip).then(verifyRconResult);
  if (ctx.request.user) {
    stream(`servers:${ctx.params.ip}:log`)
      .log(`Server paused by ${ctx.request.user.nick}`, 'info')
      .catch((e) =>
        logErrorMessage(`Server ${ctx.params.ip}: Error logging server message`, e)
      );
  }
  ctx.status = 204;
});

serversRouter.get('/:ip/pl', async (ctx) => {
  ctx.body = await getPlayerList(ctx.params.ip).then(verifyRconResult);
});

serversRouter.get('/:ip/si', async (ctx: Context) => {
  ctx.body = await getServerInfo(ctx.params.ip).then(verifyRconResult);
});

serversRouter.delete('/:address', protect('server_admin'), async (ctx) => {
  const { address } = ctx.params;
  const server = await client().deleteServer(address);
  const rcon = await client().deleteServerRcon(address);
  const instance = await deleteInstance(address).catch((e) => e);
  const redis = await ServerApi.delete(address).catch((e) => e);
  if (ctx.request.user) {
    stream(`servers:${address}:log`)
      .log(`Server deleted by ${ctx.request.user.nick}`, 'info')
      .catch((e) =>
        logErrorMessage(`Server ${address}: Error logging server message`, e)
      );
  }
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

  const liveServer = ServerApi.init(server);
  ctx.assert(liveServer, 502, 'Failed to create live server');

  ctx.body = liveServer;
});

serversRouter.get('/:address/stream', async (ctx) => {
  ctx.request.socket.setTimeout(0);
  ctx.req.socket.setNoDelay(true);
  ctx.req.socket.setKeepAlive(true);

  ctx.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const sseStream = new ServerInfoStream();
  const { address } = ctx.params;

  await addClient(address, sseStream);

  const interval = setInterval(() => {
    sseStream.writeHeartbeat();
  }, 10000);

  sseStream.on('close', () => {
    info(`GET /servers/${address}/stream`, 'Stream close');
    clearInterval(interval);
    removeClient(address, sseStream);
  });
  sseStream.on('error', (err) => {
    error(`GET /servers/${address}/stream`, err);
  });

  ctx.status = 200;
  ctx.body = sseStream;
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

serversRouter.get('/:address/profile.xml', async (ctx: Context): Promise<void> => {
  const options = serverGetProfileXmlQueriesSchema.safeParse(ctx.query);
  if (!options.success) {
    ctx.throw('Invalid query parameters', 400, options.error.message);
  }

  ctx.set('Content-Type', 'text/xml');
  ctx.body = generateProfileXml(options.data);
});
