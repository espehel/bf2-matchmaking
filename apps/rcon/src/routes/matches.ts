import express from 'express';
import { MatchStatus } from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { error } from '@bf2-matchmaking/logging';
import { findLiveMatch, initLiveMatch } from '../services/MatchManager';
import { closeMatch } from '../services/matches';

const router = express.Router();

router.post('/:matchid/results', async (req, res) => {
  try {
    const match = await client()
      .getMatch(parseInt(req.params.matchid))
      .then(verifySingleResult);

    if (match.status !== MatchStatus.Finished) {
      return res.status(400).send('Match is not finished.');
    }

    const errors = await closeMatch(match);

    if (errors.length > 0) {
      return res.status(400).send(errors.join(', '));
    }

    return res.sendStatus(201);
  } catch (e) {
    error('POST /matches/:matchid/results', e);
    if (e instanceof Error) {
      return res.status(500).send(e.message);
    }
    return res.status(500).send(JSON.stringify(e));
  }
});

router.post('/:matchid/live', async (req, res) => {
  const prelive = `${req.query.prelive}`.toLowerCase() === 'true';

  try {
    const match = await client()
      .getMatch(parseInt(req.params.matchid))
      .then(verifySingleResult);

    if (match.status !== MatchStatus.Ongoing) {
      return res.status(400).send({ message: `Match ${match.id} is not ongoing.` });
    }

    const liveMatch = initLiveMatch(match, { prelive });
    return res.status(201).send(liveMatch);
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).send(e.message);
    }
    return res.status(500).send(JSON.stringify(e));
  }
});

router.get('/:matchid/live', async (req, res) => {
  const match = findLiveMatch(Number(req.params.matchid));

  if (!match) {
    return res.status(404).send('Live match not found.');
  }

  return res.send(match);
});

export default router;
