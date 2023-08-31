import express, { Request } from 'express';
import {
  isServerMatch,
  MatchStatus,
  PostMatchesRequestBody,
} from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { getPlayerFromDatabase } from '../services/players';
import { toMatchPlayer } from '../mappers/player';
import { error, info, logOngoingMatchCreated } from '@bf2-matchmaking/logging';
import moment from 'moment';
import { findLiveMatch, startLiveMatch } from '../services/MatchManager';
import { processResults } from '../services/matches';

const router = express.Router();

router.post('/:matchid/results', async (req, res) => {
  try {
    const match = await client()
      .getMatch(parseInt(req.params.matchid))
      .then(verifySingleResult);

    await processResults(match);

    return res.sendStatus(201);
  } catch (e) {
    error('POST /matches/:matchid/results', e);
    if (e instanceof Error) {
      return res.status(500).send(e.message);
    }
    return res.status(500).send(JSON.stringify(e));
  }
});

router.get('/:matchid/live', async (req, res) => {
  const matchId = parseInt(req.params.matchid);
  const matchClient = findLiveMatch(matchId);
  return res.send({ round: matchClient?.liveRound, status: matchClient?.state });
});

router.post('/:matchid/poll', async (req, res) => {
  try {
    const match = await client()
      .getMatch(parseInt(req.params.matchid))
      .then(verifySingleResult);

    if (!isServerMatch(match)) {
      return res.status(400).send('Match is not linked to a server.');
    }

    const server = await client().getServerRcon(match.server.ip).then(verifySingleResult);
    startLiveMatch(match, server);
    return res.sendStatus(202);
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).send(e.message);
    }
    return res.status(500).send(JSON.stringify(e));
  }
});

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
      .updateMatch(match.id, {
        status: MatchStatus.Ongoing,
        started_at: moment().toISOString(),
      })
      .then(verifySingleResult);
    logOngoingMatchCreated(updatedMatch);

    res.status(201).send(updatedMatch);
  } catch (e) {
    error('POST /matches', e);
    if (e instanceof Error) {
      res.status(500).send(e.message);
    }
    res.status(500).send(JSON.stringify(e));
  }
});

export default router;
