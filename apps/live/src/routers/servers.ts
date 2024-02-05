import Router from '@koa/router';
import { error } from '@bf2-matchmaking/logging';
import { toFetchError } from '@bf2-matchmaking/utils';
import { isString } from '@bf2-matchmaking/types';
import {
  addPendingServer,
  getLiveServer,
  getLiveServers,
  initLiveServer,
  removeLiveServer,
} from '../services/server/ServerManager';
import { toLiveServer, getAddress, upsertServer } from '../services/server/servers';
import { exec, getPlayerList, getServerInfo, rcon } from '../services/rcon/RconManager';
export const serversRouter = new Router({
  prefix: '/servers',
});

serversRouter.post('/:ip/exec', async (ctx) => {
  const { cmd } = ctx.request.body;

  if (!isString(cmd)) {
    ctx.status = 400;
    ctx.body = { message: 'Missing cmd' };
    return;
  }

  const liveServer = getLiveServer(ctx.params.ip);

  if (!liveServer) {
    ctx.status = 404;
    ctx.body = { message: 'Live server not found' };
    return;
  }

  try {
    const reply = await liveServer.rcon().then(exec(`exec ${cmd}`));
    ctx.body = { reply };
  } catch (e) {
    ctx.status = 502;
    ctx.body = toFetchError(e);
  }
});

serversRouter.post('/:ip/unpause', async (ctx) => {
  const liveServer = getLiveServer(ctx.params.ip);

  if (!liveServer) {
    ctx.status = 404;
    ctx.body = { message: 'Live server not found' };
    return;
  }

  try {
    await liveServer.rcon().then(exec('bf2cc unpause'));
    ctx.status = 204;
  } catch (e) {
    ctx.status = 502;
    ctx.body = toFetchError(e);
  }
});
serversRouter.post('/:ip/pause', async (ctx) => {
  const liveServer = getLiveServer(ctx.params.ip);

  if (!liveServer) {
    ctx.status = 404;
    ctx.body = { message: 'Live server not found' };
    return;
  }

  try {
    await liveServer.rcon().then(exec('bf2cc pause'));
    ctx.status = 204;
  } catch (e) {
    ctx.status = 502;
    ctx.body = toFetchError(e);
  }
});

serversRouter.get('/:ip/pl', async (ctx) => {
  const liveServer = getLiveServer(ctx.params.ip);

  if (!liveServer) {
    ctx.status = 404;
    ctx.body = { message: 'Live server not found' };
    return;
  }

  try {
    ctx.body = liveServer.rcon().then(getPlayerList);
  } catch (e) {
    ctx.status = 502;
    ctx.body = toFetchError(e);
  }
});

serversRouter.get('/:ip/si', async (ctx) => {
  const liveServer = getLiveServer(ctx.params.ip);

  if (!liveServer) {
    ctx.status = 404;
    ctx.body = { message: 'Live server not found' };
    return;
  }

  try {
    ctx.body = liveServer.rcon().then(getServerInfo);
  } catch (e) {
    ctx.status = 502;
    ctx.body = toFetchError(e);
  }
});

serversRouter.delete('/:ip', async (ctx) => {
  const liveServer = removeLiveServer(ctx.params.ip);

  if (!liveServer) {
    ctx.status = 404;
    ctx.body = { message: 'Live server not found' };
    return;
  }

  ctx.body = liveServer;
});

serversRouter.post('/', async (ctx) => {
  const { ip, port, rcon_pw } = ctx.request.body;
  const rcon_port = Number(ctx.request.body.rcon_port);

  if (!isString(ip) || !isString(port) || !rcon_port || !isString(rcon_pw)) {
    ctx.status = 400;
    ctx.body = { message: 'Missing ip, port, rcon_port or rcon_pw' };
    return;
  }

  const address = await getAddress(ip);
  const isResolvingDns = address === ip;

  const serverInfo = await rcon(address, rcon_port, rcon_pw)
    .then(getServerInfo)
    .catch(() => null);

  if (!serverInfo && isResolvingDns) {
    addPendingServer({ address, port, rcon_port, rcon_pw });
    ctx.status = 202;
    ctx.body = null;
    return;
  }

  if (!serverInfo) {
    ctx.status = 502;
    ctx.body = { message: 'Failed to connect to server.' };
    return;
  }

  try {
    const serverRcon = await upsertServer(address, port, rcon_port, rcon_pw, serverInfo);

    const liveServer = await initLiveServer(serverRcon);
    if (!liveServer) {
      ctx.status = 502;
      ctx.body = { message: 'Failed to create live server.' };
      return;
    }
    ctx.body = toLiveServer(liveServer);
  } catch (e) {
    error('POST /servers', e);
    ctx.status = 500;
    ctx.body = toFetchError(e);
  }
});

serversRouter.get('/:ip', async (ctx) => {
  const server = getLiveServer(ctx.params.ip);

  if (!server) {
    ctx.status = 404;
    ctx.body = { message: 'Live server not found' };
    return;
  }

  ctx.body = toLiveServer(server);
});

serversRouter.get('/', async (ctx) => {
  ctx.body = getLiveServers().map(toLiveServer);
});
