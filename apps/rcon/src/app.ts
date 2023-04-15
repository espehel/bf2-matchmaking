import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import invariant from 'tiny-invariant';
import { createClient } from './bf2-client';
import { mapListPlayers, mapServerInfo } from './mappers';
import { error, info } from '@bf2-matchmaking/logging';
import { client } from '@bf2-matchmaking/supabase';
import { api } from '@bf2-matchmaking/utils';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/run', async (req, res) => {
  const { host, port, password, cmd } = req.body;

  if (host && port) {
    const client = await createClient({
      host,
      port,
      password,
    });
    const data = await client.send(cmd);
    res.send(data);
  } else {
    res.status(400).send('Missing host or port.');
  }
});

app.post('/si', async (req, res) => {
  const { host, port, password } = req.body;

  if (host && port) {
    const client = await createClient({
      host,
      port,
      password,
    });
    const data = await client.send('bf2cc si');
    res.send(mapServerInfo(data));
  } else {
    res.status(400).send('Missing host or port.');
  }
});

app.post('/waconnect', async (req, res) => {
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

app.post('/pl', async (req, res) => {
  const { host, port, password } = req.body;

  if (host && port) {
    const client = await createClient({
      host,
      port,
      password,
    });
    const data = await client.send('bf2cc pl');
    res.send(mapListPlayers(data));
  } else {
    res.status(400).send('Missing host or port.');
  }
});

app.get('/', async (req, res) => {
  const { cmd } = req.query;
  invariant(process.env.RCON_HOST, 'HOST not defined in .env');
  invariant(process.env.RCON_PORT, 'PORT not defined in .env');
  invariant(process.env.RCON_PASSWORD, 'PASSWORD not defined in .env');

  const client = await createClient({
    host: process.env.RCON_HOST,
    port: parseInt(process.env.RCON_PORT),
    password: process.env.RCON_PASSWORD,
  });
  if (cmd && cmd === 'bf2cc si') {
    const data = await client.send(cmd.toString());
    res.send(mapServerInfo(data));
  } else {
    res.send('No valid command defined.');
  }
});

/**
 * Get rounds from one time to another
 * server can note info every second into a round variable with the current time.
 * When time is lower than pervious a new round has started, and we now store info in a new variable
 * We then can fetch all rounds between match start and now(), and in frontend select the wanted rounds.
 */

app.get('/rounds', async (req, res) => {
  return res.status(501).send('Endpoint is not ready yet.');
});

app.post('/rounds', async (req, res) => {
  const { event, serverInfo, si, pl } = req.body;
  const bf2ccSi = mapServerInfo(si);
  const bf2ccPl = mapListPlayers(pl);

  if (bf2ccSi && bf2ccSi.connectedPlayers === '0') {
    return res.status(202).send('Empty server, no round created.');
  }

  const { data: server, error: serversError } = await client().upsertServer(
    serverInfo.ip,
    serverInfo.serverName
  );

  if (serversError) {
    error('POST /rounds', serversError.message);
    return res.status(502).send(serversError.message);
  }

  const { data: map, error: mapsError } = await client().searchMap(event.map).single();
  if (mapsError) {
    error('POST /rounds', mapsError.message);
    return res.status(400).send('Invalid map name.');
  }

  const { data: round, error: roundsError } = await client().createRound({
    team1_name: event.team1.name,
    team1_tickets: event.team1.tickets,
    team2_name: event.team2.name,
    team2_tickets: event.team2.tickets,
    map: map.id,
    server: server.ip,
    si: bf2ccSi && JSON.stringify(bf2ccSi),
    pl: bf2ccPl && JSON.stringify(bf2ccPl),
  });

  if (roundsError) {
    error('POST /rounds', roundsError.message);
    return res.status(502).send(roundsError.message);
  }

  return res.status(201).send(`Round ${round.id} created.`);
});

app.post('/servers', async (req, res) => {
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

app.get('/servers', async (req, res) => {
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

app.get('/servers/:ip', async (req, res) => {
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

app.get('/health', (req, res) => {
  res.status(200).send('Ok');
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`rcon api listening on port ${PORT}`);
});
