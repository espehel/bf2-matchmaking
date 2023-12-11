import express from 'express';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import {
  rcon,
  getServerInfo,
  getPlayerList,
  exec,
  switchPlayers,
} from '../net/RconManager';
import { RconBf2Server } from '@bf2-matchmaking/types';
import { createRconBF2Server } from '../services/servers';
import {
  addPendingServer,
  getServerRcon,
  initLiveServer,
  isOffline,
  reconnectLiveServer,
  removeLiveServer,
} from '../net/ServerManager';
import { error, info } from '@bf2-matchmaking/logging';
import { api, assertArray, assertObj } from '@bf2-matchmaking/utils';
import { createLiveMatchFromDns } from '../services/matches';
import { mapMapList } from '../mappers/rcon';
import { findMap } from '../services/maps';
const router = express.Router();

router.post('/:ip/maps', async (req, res) => {
  try {
    const rconClient = await getServerRcon(req.params.ip);
    const map = findMap(req.body.map);
    const mapList = await rconClient.send('exec maplist.list').then(mapMapList);
    assertObj(map, 'Could not find map');
    assertArray(mapList, 'Could get map list from server');
    const id = mapList.indexOf(map.name.toLowerCase().replace(/ /g, '_'));
    await rconClient.send(`exec admin.setNextLevel ${id}`);
    await rconClient.send('exec admin.runNextLevel');
    const { currentMapName, nextMapName } = await getServerInfo(rconClient);
    res.send({ currentMapName, nextMapName });
  } catch (e) {
    if (e instanceof Error) {
      res.status(502).send(e.message);
    }
    res.status(502).send(e);
  }
});

router.post('/:ip/players/switch', async (req, res) => {
  const { players } = req.body;

  try {
    const { id, rcon_port, rcon_pw } = await client()
      .getServerRcon(req.params.ip)
      .then(verifySingleResult);

    const result = await rcon(id, rcon_port, rcon_pw).then(switchPlayers(players));
    res.send(result);
  } catch (e) {
    res.status(502).send(e);
  }
});

router.post('/:ip/exec', async (req, res) => {
  const { cmd } = req.body;

  if (typeof cmd !== 'string') {
    return res.status(400);
  }

  try {
    const { id, rcon_port, rcon_pw } = await client()
      .getServerRcon(req.params.ip)
      .then(verifySingleResult);

    const reply = await rcon(id, rcon_port, rcon_pw).then(exec(`exec ${cmd}`));
    res.send({ reply });
  } catch (e) {
    res.status(502).send(e);
  }
});
router.post('/:ip/unpause', async (req, res) => {
  try {
    const { id, rcon_port, rcon_pw } = await client()
      .getServerRcon(req.params.ip)
      .then(verifySingleResult);

    await rcon(id, rcon_port, rcon_pw).then(exec('bf2cc unpause'));
    res.sendStatus(204);
  } catch (e) {
    res.status(502).send(e);
  }
});
router.post('/:ip/pause', async (req, res) => {
  try {
    const { id, rcon_port, rcon_pw } = await client()
      .getServerRcon(req.params.ip)
      .then(verifySingleResult);

    await rcon(id, rcon_port, rcon_pw).then(exec('bf2cc pause'));
    res.sendStatus(204);
  } catch (e) {
    res.status(502).send(e);
  }
});

router.get('/:ip/pl', async (req, res) => {
  try {
    const { id, rcon_port, rcon_pw } = await client()
      .getServerRcon(req.params.ip)
      .then(verifySingleResult);

    const pl = await rcon(id, rcon_port, rcon_pw).then(getPlayerList);
    return res.send(pl);
  } catch (e) {
    res.status(502).send(e);
  }
});

router.get('/:ip/si', async (req, res) => {
  try {
    const { id, rcon_port, rcon_pw } = await client()
      .getServerRcon(req.params.ip)
      .then(verifySingleResult);

    const si = await rcon(id, rcon_port, rcon_pw).then(getServerInfo);
    res.send(si);
  } catch (e) {
    res.status(502).send(e);
  }
});

router.get('/:ip', async (req, res) => {
  try {
    const { ip } = req.params;
    const server = await client().getServer(ip).then(verifySingleResult);

    if (isOffline(ip)) {
      await reconnectLiveServer(ip);
    }

    const rconServer = await createRconBF2Server(server);

    res.send(rconServer);
  } catch (e) {
    res.status(502).send(e);
  }
});

router.delete('/:ip/live', async (req, res) => {
  const { ip } = req.params;
  const liveServer = removeLiveServer(ip);
  if (liveServer) {
    res.status(200).send();
  } else {
    res.status(404).send();
  }
});

router.post('/', async (req, res) => {
  const { ip, port, rcon_port, rcon_pw } = req.body;
  try {
    const { data: dns } = await api.platform().getServerDns(ip);

    let hostname: string = ip;
    if (dns) {
      hostname = dns.name;
    }

    const serverInfo = await rcon(hostname, rcon_port, rcon_pw)
      .then(getServerInfo)
      .catch(() => null);

    if (!serverInfo && dns) {
      addPendingServer({ dns, port, rcon_port, rcon_pw });
      return res.status(202).send();
    }

    if (!serverInfo) {
      return res.status(502).send({ message: 'Failed to connect to server.' });
    }

    const server = await client()
      .upsertServer({ ip: hostname, port, name: serverInfo.serverName })
      .then(verifySingleResult);

    const serverRcon = await client()
      .upsertServerRcon({ id: hostname, rcon_port, rcon_pw })
      .then(verifySingleResult);
    await initLiveServer(serverRcon);

    if (dns) {
      await createLiveMatchFromDns(dns, server);
    }

    info(
      'routes/servers',
      `Upserted server ${hostname} with name ${serverInfo.serverName}`
    );

    res.status(200).send({ info: serverInfo, server, rcon: serverRcon });
  } catch (e) {
    error('POST /servers', e);
    res.status(500).send(e);
  }
});

router.get('/', async (req, res) => {
  const { data, error: err } = await client().getServers();

  if (err) {
    return res.status(502).send(err.message);
  }

  const servers: Array<RconBf2Server> = await Promise.all(data.map(createRconBF2Server));

  res.send(servers);
});
export default router;
