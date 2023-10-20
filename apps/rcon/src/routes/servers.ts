import express from 'express';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import {
  rcon,
  getServerInfo,
  getPlayerList,
  exec,
  switchPlayers,
} from '../net/RconManager';
import { getJoinmeHref } from '@bf2-matchmaking/utils';
import { RconBf2Server } from '@bf2-matchmaking/types';
import { externalApi } from '@bf2-matchmaking/utils';
import { getLiveInfo, getLiveServer, getLiveServers } from '../net/ServerManager';
const router = express.Router();

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
    const server = await client().getServer(req.params.ip).then(verifySingleResult);
    const { id, rcon_port, rcon_pw } = await client()
      .getServerRcon(req.params.ip)
      .then(verifySingleResult);

    const info = await rcon(id, rcon_port, rcon_pw).then(getServerInfo);
    const joinmeHref = await getJoinmeHref(server);

    res.send({ ...server, info, joinmeHref });
  } catch (e) {
    res.status(502).send(e);
  }
});

router.post('/', async (req, res) => {
  res.sendStatus(410);
});

router.get('/', async (req, res) => {
  const { data, error: err } = await client().getServers();

  if (err) {
    return res.status(502).send(err.message);
  }

  const servers: Array<RconBf2Server> = await Promise.all(
    data.map(async (server) => {
      const joinmeHref = await getJoinmeHref(server);
      const { data: location } = await externalApi.ip().getIpLocation(server.ip);
      const country = location?.country || null;
      const city = location?.city || null;
      const info = getLiveInfo(server.ip);
      return { ...server, info, joinmeHref, country, city };
    })
  );
  res.send(servers);
});
export default router;
