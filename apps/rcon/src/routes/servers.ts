import express from 'express';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { rcon, getServerInfo, getPlayerList, exec } from '../net/RconManager';

const router = express.Router();

router.post('/:ip/players/switch', async (req, res) => {
  const { players } = req.body;

  try {
    const { id, rcon_port, rcon_pw } = await client()
      .getServerRcon(req.params.ip)
      .then(verifySingleResult);

    const resultArray = [];
    for (const playerId of players) {
      const result = await rcon(id, rcon_port, rcon_pw).then(
        exec(`bf2cc switchplayer ${playerId} 3`)
      );
      resultArray.push(result);
    }

    res.send(resultArray);
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
    res.send({ ...server, info });
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

  const servers = await Promise.all(
    data.map(async (server) => {
      try {
        const { id, rcon_port, rcon_pw } = await client()
          .getServerRcon(server.ip)
          .then(verifySingleResult);
        const info = await rcon(id, rcon_port, rcon_pw).then(getServerInfo);
        return { ...server, info };
      } catch (e) {}
      return { ...server, info: null };
    })
  );
  res.send(servers);
});
export default router;
