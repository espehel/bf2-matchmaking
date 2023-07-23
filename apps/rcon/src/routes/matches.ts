import express, { Request } from 'express';
import { MatchStatus, PostMatchesRequestBody } from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { getPlayerFromDatabase } from '../services/players';
import { toMatchPlayer } from '../mappers/player';
import { error, info } from '@bf2-matchmaking/logging';
import { createClient } from '../net/rcon-client';
import invariant from 'tiny-invariant';
import { listenForMatchRounds, startWebAdminListener } from '../services/network-service';

const router = express.Router();

router.post('/', async (req: Request<{}, {}, PostMatchesRequestBody>, res) => {
  const { config, team1, team2, serverIp } = req.body;
  info('POST /matches', `Received request for config ${config} and server ${serverIp}`);
  try {
    const match = await client().createMatchFromConfig(config).then(verifySingleResult);
    const dbPlayers1 = await Promise.all(team1.map(getPlayerFromDatabase));
    const dbPlayers2 = await Promise.all(team2.map(getPlayerFromDatabase));
    await Promise.all([
      client().createMatchPlayers(dbPlayers1.map(toMatchPlayer(match.id, 'a'))),
      client().createMatchPlayers(dbPlayers2.map(toMatchPlayer(match.id, 'b'))),
      client().updateMatch(match.id, { server: serverIp }),
    ]);
    const updatedMatch = await client()
      .updateMatch(match.id, { status: MatchStatus.Ongoing })
      .then(verifySingleResult);
    info('POST /matches', `Created match ${updatedMatch.id}`);

    await listenForMatchRounds(updatedMatch);

    res.status(201).send(updatedMatch);
  } catch (e) {
    error('POST /matches', e);
    res.status(500).send(JSON.stringify(e));
  }
});

export default router;
