import express, { Request } from 'express';
import { MatchStatus, PostMatchesRequestBody } from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { getPlayerFromDatabase } from '../services/players';
import { toMatchPlayer } from '../mappers/player';
import { info } from '@bf2-matchmaking/logging';

const router = express.Router();

router.post('/', async (req: Request<{}, {}, PostMatchesRequestBody>, res) => {
  const { config, team1, team2 } = req.body;
  try {
    const match = await client().createMatchFromConfig(config).then(verifySingleResult);
    const dbPlayers1 = await Promise.all(team1.map(getPlayerFromDatabase));
    const dbPlayers2 = await Promise.all(team2.map(getPlayerFromDatabase));
    await client().createMatchPlayers(dbPlayers1.map(toMatchPlayer(match.id, 'a')));
    await client().createMatchPlayers(dbPlayers2.map(toMatchPlayer(match.id, 'b')));
    const updatedMatch = await client()
      .updateMatch(match.id, { status: MatchStatus.Ongoing })
      .then(verifySingleResult);
    info('POST /matches', `Created match ${updatedMatch.id}`);
    res.status(201).send(updatedMatch);
  } catch (e) {
    res.status(500).send(JSON.stringify(e));
  }
});

export default router;
