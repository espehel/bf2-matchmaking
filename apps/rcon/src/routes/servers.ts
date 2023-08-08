import express from 'express';
import { error, info } from '@bf2-matchmaking/logging';
import { client } from '@bf2-matchmaking/supabase';
import invariant from 'tiny-invariant';
import { createClient } from '../net/rcon-client';
import { mapListPlayers, mapServerInfo } from '../mappers/rcon';

const router = express.Router();

router.get('/:ip/pl', async (req, res) => {
  const { data, error } = await client().getServerRcon(req.params.ip);

  if (error) {
    return res.status(502).send(error);
  }

  const rconClient = await createClient({
    host: data.id,
    port: data.rcon_port,
    password: data.rcon_pw,
  });

  try {
    const pl = await rconClient.send('bf2cc pl').then(mapListPlayers);
    res.send(pl);
  } catch (e) {
    res.status(502).send(e);
  }
});

router.get('/:ip/si', async (req, res) => {
  const { data, error } = await client().getServerRcon(req.params.ip);

  if (error) {
    return res.status(502).send(error);
  }

  const rconClient = await createClient({
    host: data.id,
    port: data.rcon_port,
    password: data.rcon_pw,
  });

  try {
    const si = await rconClient.send('bf2cc si').then(mapServerInfo);
    res.send(si);
  } catch (e) {
    res.status(502).send(e);
  }
});

router.get('/:ip', async (req, res) => {
  const { data, error: err } = await client().getServer(req.params.ip);

  if (err) {
    error('GET /servers', err);
    return res.status(502).send(err.message);
  }

  invariant(process.env.RCON_PORT, 'PORT not defined in .env');
  invariant(process.env.RCON_PASSWORD, 'PASSWORD not defined in .env');
  const port = parseInt(process.env.RCON_PORT);
  const password = process.env.RCON_PASSWORD;

  const rconClient = await createClient({
    host: data.ip,
    port,
    password,
  });

  if (!rconClient.connected) {
    return res.status(502).send(rconClient.error);
  }

  const si = await rconClient.send('bf2cc si');

  res.send({ ...data, info: mapServerInfo(si) });
});

router.post('/', async (req, res) => {
  const { ip, serverName } = req.body;
  info('POST /servers', 'Received request');
  const { data: server, error: err } = await client().upsertServer(ip, serverName);

  if (err) {
    error('POST /servers', err);
    res.status(502).send(err.message);
  } else {
    res.status(201).send(server);
  }
});

router.get('/', async (req, res) => {
  const { data, error: err } = await client().getServers();

  if (err) {
    error('GET /servers', err);
    return res.status(502).send(err.message);
  }

  invariant(process.env.RCON_PORT, 'PORT not defined in .env');
  invariant(process.env.RCON_PASSWORD, 'PASSWORD not defined in .env');
  const port = parseInt(process.env.RCON_PORT);
  const password = process.env.RCON_PASSWORD;

  const servers = await Promise.all(
    data.map(async (server) => {
      const rconClient = await createClient({
        host: server.ip,
        port,
        password,
        timeout: 2000,
      });
      if (rconClient.connected) {
        const si = await rconClient.send('bf2cc si');
        return { ...server, info: mapServerInfo(si) };
      }
      return { ...server, info: null };
    })
  );
  res.send(servers);
});
export default router;
