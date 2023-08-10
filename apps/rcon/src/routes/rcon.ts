import express from 'express';
import invariant from 'tiny-invariant';
import { createClient } from '../net/rcon-client';
import { mapListPlayers, mapServerInfo } from '../mappers/rcon';
import { client } from '@bf2-matchmaking/supabase';
import { logSupabaseError } from '@bf2-matchmaking/logging';

const router = express.Router();

router.post('/pl', async (req, res) => {
  const { host, port, password } = req.body;

  if (!(host || port || password)) {
    return res.status(400).send('Missing host, port or password.');
  }

  const rconClient = await createClient({
    host,
    port,
    password,
  });

  if (rconClient.error) {
    return res.status(502).send(rconClient.error);
  }

  try {
    const pl = await rconClient.send('bf2cc pl').then(mapListPlayers);
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

  const rconClient = await createClient({
    host,
    port,
    password,
  });

  if (rconClient.error) {
    return res.status(502).send(rconClient.error);
  }

  try {
    const si = await rconClient.send('bf2cc si').then(mapServerInfo);
    res.send(si);
  } catch (e) {
    res.status(502).send(e);
  }
});

router.post('/waconnect', async (req, res) => {
  const { host, port, password } = req.body;

  if (host && port) {
    const client = await createClient({
      host,
      port,
      password,
    });
    const data = await client.send('wa connect localhost 8080');
    res.send(data);
  } else {
    res.status(400).send('Missing host or port.');
  }
});

/**
 * @param serverIp: Ip of server where the player is located
 * @param playerId: The server's id of the player
 *
 * @returns PlayerListItem
 */
router.get('/:serverIp/:playerId', async (req, res) => {
  invariant(process.env.RCON_PASSWORD, 'PASSWORD not defined in .env');
  const { serverIp, playerId } = req.params;
  const { error } = await client().getServer(serverIp);

  if (error) {
    logSupabaseError('Failed to get server info from db', error);
    return res.status(502).send(error);
  }

  const rconClient = await createClient({
    host: serverIp,
    port: 4711, // TODO: handle the storing of port
    password: process.env.RCON_PASSWORD, // TODO: handle the storing of password
  });
  const players = await rconClient.send('bf2cc pl').then(mapListPlayers);
  const player = players?.find((p) => p.index === playerId);
  if (player) {
    return res.status(200).send(player);
  }
  return res.status(404).send('Player not found.');
});

export default router;
