import {
  LiveServerState,
  LiveState,
  MatchesJoined,
  MatchPlayersRow,
  PlayersRow,
  RoundsRow,
} from '@bf2-matchmaking/types';
import { info, logAddMatchRound, logChangeLiveState } from '@bf2-matchmaking/logging';
import { formatSecToMin, hasKeyhash } from '@bf2-matchmaking/utils';
import {
  getMatch,
  getMatchInfo,
  getMatchPlayers,
  getMatchRounds,
  setMatchInfo,
  setMatchPlayer,
  setMatchRounds,
} from '@bf2-matchmaking/redis';
import { addTeamPlayerToLiveMatch } from './players';
import { client } from '@bf2-matchmaking/supabase';
import { DateTime } from 'luxon';
import {
  finishMatch,
  hasPlayedAllRounds,
  isOngoingRound,
  isServerEmptied,
  removeRedisMatch,
  syncRedisMatch,
} from './matches';
import { isServerIdentified } from '../server/ServerManager';
import { insertRound } from './rounds';

export async function updateMatch(
  matchId: string,
  live: LiveState
): Promise<[LiveServerState, MatchesJoined, Array<RoundsRow>]> {
  const matchInfo = await getMatchInfo();
  const rounds = await getMatchRounds(matchId);
  let [match, players] = await handleNewPlayers(); // this could be done outside this function
  const nextState = getNextState();
  await handleNextState();
  return [nextState, match, rounds];

  function logState(match: any, live: LiveState) {
    info(
      'LiveMatch',
      `${formatSecToMin(live.roundTime)} (${live.team1_Name} ${live.team1_tickets} - ${
        live.team2_Name
      } ${live.team2_tickets}) [${live.players.length}/${match.size} - ${match.state} - ${
        live.serverName
      }]`
    );
  }

  async function handleNewPlayers() {
    let match: MatchesJoined = await getMatch();
    const players = await getMatchPlayers(matchId);
    for (const bf2Player of live.players) {
      if (players.has(bf2Player.keyhash)) {
        continue;
      }
      if (bf2Player.getName.includes('STREAM')) {
        continue;
      }

      let player: PlayersRow | null | undefined = match.players.find(
        hasKeyhash(bf2Player.keyhash)
      );

      if (!player) {
        player = await addTeamPlayerToLiveMatch(match, bf2Player.keyhash);
        if (player) {
          match = await syncRedisMatch(matchId);
        } else {
          continue;
        }
      }

      const connectedMp = match.teams.find(
        (mp) => mp.player_id === player?.id && mp.connected_at
      );
      if (connectedMp) {
        await setMatchPlayer(matchId, bf2Player.keyhash, connectedMp);
        continue;
      }

      const { data: mp } = await client().updateMatchPlayer(match.id, player.id, {
        connected_at: DateTime.now().toISO(),
      });

      if (mp) {
        await setMatchPlayer(matchId, bf2Player.keyhash, mp);
        match = await syncRedisMatch(matchId);
      }
    }
    return [match, players] as [MatchesJoined, Map<string, MatchPlayersRow>];
  }

  function getNextState(): LiveServerState {
    if (hasPlayedAllRounds(match.config, rounds)) {
      return 'finished';
    }

    if (isServerEmptied(rounds, live)) {
      return 'finished';
    }

    if (!isServerIdentified(live.players.length, match.config.size)) {
      return 'pending';
    }

    if (
      matchInfo.state === 'pending' &&
      isServerIdentified(live.players.length, match.config.size)
    ) {
      return 'warmup';
    }

    if (matchInfo.state === 'endlive') {
      return 'warmup';
    }

    if (matchInfo.state === 'prelive' && live.roundTime === '0') {
      return 'live';
    }

    if (
      matchInfo.state === 'warmup' &&
      Number(live.players.length) !== match.config.size
    ) {
      return 'warmup';
    }

    if (isOngoingRound(live)) {
      return 'live';
    }

    if (matchInfo.state !== 'live') {
      return matchInfo.state;
    }

    return 'endlive';
  }
  async function addRound() {
    const round = await insertRound(match, live);
    logAddMatchRound(round, match, live);
    info('onLiveServerUpdate', `Created round ${round.id}`);
    await setMatchRounds(matchId, [...rounds, round]);
  }
  async function finish() {
    await finishMatch(match, live);
    await removeRedisMatch(matchId);
  }
  async function handleNextState() {
    if (nextState === 'pending' && matchInfo.state !== 'pending') {
      await setMatchInfo(matchId, { pendingSince: DateTime.utc().toISO() });
    }
    if (nextState !== 'pending' && matchInfo.state === 'pending') {
      await setMatchInfo(matchId, { pendingSince: null });
    }

    // Do somewhere else
    /*if (matchInfo.state === 'pending' && nextState === 'warmup') {
      await updateLiveMatchServerIfMix(this, liveInfo);
    }*/

    if (nextState === 'live' && !match.live_at) {
      match = await syncRedisMatch(matchId, { live_at: DateTime.utc().toISO() });
    }

    if (nextState === 'endlive') {
      await addRound();
    }

    if (nextState === 'finished' && matchInfo.state !== 'finished') {
      await finish();
    }

    if (matchInfo.state !== nextState) {
      logChangeLiveState(matchInfo.state, nextState, match, rounds, live);
      await setMatchInfo(matchId, { state: nextState });
    }
  }
}
