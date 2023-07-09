import express from 'express';
import { error, info } from '@bf2-matchmaking/logging';
import { client } from '@bf2-matchmaking/supabase';
import invariant from 'tiny-invariant';
import { createClient } from '../bf2-client';
import { mapServerInfo } from '../mappers/rcon';

const router = express.Router();

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

export default router;
