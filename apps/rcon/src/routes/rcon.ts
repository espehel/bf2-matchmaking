import express from 'express';
import { getPlayerList, getServerInfo, rcon } from '../net/RconManager';
import { getLiveServers } from '../net/ServerManager';

const router = express.Router();

router.get('/servers', async (req, res) => {
  res.send(getLiveServers());
});

router.post('/pl', async (req, res) => {
  const { host, port, password } = req.body;

  if (!(host || port || password)) {
    return res.status(400).send('Missing host, port or password.');
  }

  try {
    const pl = await rcon(host, port, password).then(getPlayerList);
    res.send(pl);
  } catch (e) {
    res.status(502).send(e);
  }
});

router.post('/si', async (req, res) => {
  const { host, port, password } = req.body;

  if (!(host || port || password)) {
    return res.status(400).send('Missing host, port or password.');
  }

  try {
    const si = await rcon(host, port, password).then(getServerInfo);
    res.send(si);
  } catch (e) {
    res.status(502).send(e);
  }
});

router.post('/waconnect', async (req, res) => {
  res.sendStatus(410);
});

router.get('/:serverIp/:playerId', async (req, res) => {
  res.sendStatus(410);
});

export default router;
