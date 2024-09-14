import Router from '@koa/router';
import {
  assertArray,
  assertObj,
  assertString,
  toFetchError,
  verify,
} from '@bf2-matchmaking/utils';
import { isString } from '@bf2-matchmaking/types';
import { error } from '@bf2-matchmaking/logging';
import {
  createSocket,
  exec,
  getMapList,
  getPlayerList,
  getServerInfo,
  pauseRound,
  restartServer,
  unpauseRound,
} from '@bf2-matchmaking/services/rcon';
import { restartWithInfantryMode, restartWithVehicleMode } from './http-api';
import { hash } from '@bf2-matchmaking/redis/hash';
import {
  createPendingServer,
  deleteServer,
  getAddress,
  getLiveServer,
  getLiveServers,
  upsertServer,
} from './server-service';
import { DateTime } from 'luxon';
import { createServer, updateLiveServer } from '@bf2-matchmaking/services/server';

export const serversRouter = new Router({
  prefix: '/servers',
});

serversRouter.post('/:ip/restart', async (ctx) => {
  const { mode, map } = ctx.request.body;
  try {
    if (mode === 'infantry') {
      await restartWithInfantryMode(ctx.params.ip, map).then(verify);
    }
    if (mode === 'vehicles') {
      await restartWithVehicleMode(ctx.params.ip, map).then(verify);
    }
    if (!mode) {
      await restartServer(ctx.params.ip);
    }
  } catch (e) {
    ctx.status = 502;
    ctx.body = toFetchError(e);
  }
  ctx.status = 204;
});
serversRouter.post('/:ip/players/switch', async (ctx) => {
  ctx.body = { message: 'Not implemented' };
  ctx.status = 501;
});
serversRouter.post('/:ip/maps', async (ctx) => {
  try {
    const map = await hash('cached:maps').get(ctx.request.body.map.toString());
    assertString(map, 'Could not find map');

    const { data: mapList } = await getMapList(ctx.params.ip);
    assertArray(mapList, 'Could not get map list from server');

    const id = mapList.indexOf(map);

    await exec(ctx.params.ip, `admin.setNextLevel ${id}`);
    await exec(ctx.params.ip, 'admin.runNextLevel');

    const { data: info } = await getServerInfo(ctx.params.ip);
    assertObj(info, 'Failed to get updated info');
    ctx.body = { currentMapName: info.currentMapName, nextMapName: info.nextMapName };
  } catch (e) {
    ctx.status = 500;
    ctx.body = toFetchError(e);
  }
});
serversRouter.post('/:ip/exec', async (ctx) => {
  const { cmd } = ctx.request.body;

  if (!isString(cmd)) {
    ctx.status = 400;
    ctx.body = { message: 'Missing cmd' };
    return;
  }

  try {
    const { data, error } = await exec(ctx.params.ip, cmd);
    if (error) {
      ctx.status = 502;
      ctx.body = error;
    }
    ctx.body = data;
  } catch (e) {
    ctx.status = 502;
    ctx.body = toFetchError(e);
  }
});

serversRouter.post('/:ip/unpause', async (ctx) => {
  try {
    await unpauseRound(ctx.params.ip);
    ctx.status = 204;
  } catch (e) {
    ctx.status = 502;
    ctx.body = toFetchError(e);
  }
});
serversRouter.post('/:ip/pause', async (ctx) => {
  try {
    await pauseRound(ctx.params.ip);
    ctx.status = 204;
  } catch (e) {
    ctx.status = 502;
    ctx.body = toFetchError(e);
  }
});

serversRouter.get('/:ip/pl', async (ctx) => {
  try {
    const { data, error } = await getPlayerList(ctx.params.ip);
    if (error) {
      ctx.status = 502;
      ctx.body = error;
    }
    ctx.body = data;
  } catch (e) {
    ctx.status = 500;
    ctx.body = toFetchError(e);
  }
});

serversRouter.get('/:ip/si', async (ctx) => {
  try {
    const { data, error } = await getServerInfo(ctx.params.ip);
    if (error) {
      ctx.status = 502;
      ctx.body = error;
    }
    ctx.body = data;
  } catch (e) {
    ctx.status = 502;
    ctx.body = toFetchError(e);
  }
});

serversRouter.delete('/:ip', async (ctx) => {
  await deleteServer(ctx.params.ip);
  ctx.status = 204;
});

serversRouter.post('/', async (ctx) => {
  const { ip, port, rcon_pw, demo_path } = ctx.request.body;
  const rcon_port = Number(ctx.request.body.rcon_port);

  if (!isString(ip) || !isString(port) || !rcon_port || !isString(rcon_pw)) {
    ctx.status = 400;
    ctx.body = { message: 'Missing ip, port, rcon_port or rcon_pw' };
    return;
  }

  const address = await getAddress(ip);
  const isResolvingDns = address === ip;
  const socket = createSocket({
    id: address,
    rcon_port,
    rcon_pw,
    created_at: DateTime.now().toISO(),
  });

  if (!socket && isResolvingDns) {
    createPendingServer(
      {
        address,
        port,
        rcon_port,
        rcon_pw,
        demo_path,
      },
      0
    );
    ctx.status = 202;
    ctx.body = null;
    return;
  }
  const { data: serverInfo } = await getServerInfo(address);
  if (!serverInfo) {
    ctx.status = 502;
    ctx.body = { message: 'Failed to connect to server.' };
    return;
  }

  try {
    const dbServer = await upsertServer(
      address,
      port,
      rcon_port,
      rcon_pw,
      serverInfo,
      demo_path
    );

    await createServer(dbServer);
    const liveServer = await getLiveServer(address);
    if (!liveServer) {
      ctx.status = 502;
      ctx.body = { message: 'Failed to create live server.' };
      return;
    }
    ctx.body = liveServer;
  } catch (e) {
    error('POST /servers', e);
    ctx.status = 500;
    ctx.body = toFetchError(e);
  }
});

serversRouter.get('/:ip', async (ctx) => {
  await updateLiveServer(ctx.params.ip);
  const server = await getLiveServer(ctx.params.ip);

  if (!server) {
    ctx.status = 404;
    ctx.body = { message: 'Live server not found' };
    return;
  }

  ctx.body = server;
});

serversRouter.get('/', async (ctx) => {
  ctx.body = await getLiveServers();
});
