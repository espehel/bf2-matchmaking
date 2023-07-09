import express from 'express';
import { mapListPlayers, mapServerInfo } from '../mappers/rcon';
import { client } from '@bf2-matchmaking/supabase';
import { error } from '@bf2-matchmaking/logging';

const router = express.Router();

/**
 * Get rounds from one time to another
 * server can note info every second into a round variable with the current time.
 * When time is lower than pervious a new round has started, and we now store info in a new variable
 * We then can fetch all rounds between match start and now(), and in frontend select the wanted rounds.
 */

router.get('/', async (req, res) => {
  return res.status(501).send('Endpoint is not ready yet.');
});

router.post('/', async (req, res) => {
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

export default router;
