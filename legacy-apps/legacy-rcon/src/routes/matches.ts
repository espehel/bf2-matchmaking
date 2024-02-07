import express from 'express';
import { MatchStatus } from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { error, info } from '@bf2-matchmaking/logging';
import { findLiveMatch, getLiveMatches, startLiveMatch } from '../services/MatchManager';
import { closeMatch } from '../services/matches';
import { findServer, getLiveServer, resetLiveMatchServers } from '../net/ServerManager';

const router = express.Router();

router.post('/:matchid/results', async (req, res) => {
  try {
    const match = await client()
      .getMatch(parseInt(req.params.matchid))
      .then(verifySingleResult);

    if (match.status !== MatchStatus.Finished) {
      return res.status(400).send('Match is not finished.');
    }

    const { results, errors } = await closeMatch(match);

    if (errors) {
      return res.status(400).send(errors.join(', '));
    }

    return res.status(201).send(results);
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

    const liveMatch = startLiveMatch(match, { prelive });
    return res.status(201).send(liveMatch);
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).send(e.message);
    }
    return res.status(500).send(JSON.stringify(e));
  }
});

router.post('/:matchid/live/:address', async (req, res) => {
  const force = `${req.query.force}`.toLowerCase() === 'true';

  try {
    const liveMatch = findLiveMatch(Number(req.params.matchid));
    if (!liveMatch) {
      return res.status(404).send({ message: `Live match not found.` });
    }
    const liveServer = getLiveServer(req.params.address);
    if (!liveServer) {
      return res.status(404).send({ message: `Live server not found.` });
    }

    if (liveMatch.state !== 'pending' && !force) {
      return res.status(400).send({ message: `Live match has started.` });
    }

    if (!liveServer.isIdle() && !force) {
      return res.status(400).send({ message: `Live server is already in use.` });
    }

    if ((!liveServer.isIdle() || liveMatch.state !== 'pending') && force) {
      info(
        'postMatchLiveServer',
        `Forcefully set live server ${req.params.address} to match ${liveMatch.match.id}`
      );
    }

    resetLiveMatchServers(liveMatch);
    liveServer.reset();
    liveServer.setLiveMatch(liveMatch);
    return res.status(200);
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
  const body = {
    liveInfo: match.liveInfo,
    liveState: match.state,
    matchId: match.match.id,
    players: match.match.players,
    server: match.matchServer,
  };
  return res.send(body);
});

router.get('/live', async (req, res) => {
  const liveMatches = getLiveMatches();

  const body = liveMatches.map(
    ({ liveInfo, state, match, matchServer }) => ({
      liveInfo: liveInfo,
      liveState: state,
      matchId: match.id,
      players: match.players,
      server: matchServer,
    })
  );
  return res.send(body);
});

export default router;
