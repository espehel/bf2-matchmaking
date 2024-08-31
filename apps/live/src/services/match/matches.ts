import {
  error,
  info,
  logChangeMatchStatus,
  logErrorMessage,
  logMessage,
  verbose,
} from '@bf2-matchmaking/logging';
import {
  isDiscordMatch,
  MatchConfigsRow,
  MatchesJoined,
  MatchProcessError,
  MatchStatus,
  ServerInfo,
} from '@bf2-matchmaking/types';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import {
  calculateMatchResults,
  calculatePlayerResults,
  withJoinTime,
  withMixRatingIncrement,
} from '@bf2-matchmaking/utils/src/results-utils';
import { updatePlayerRatings } from './players';
import {
  getMatchResultsEmbed,
  getWarmUpStartedEmbed,
  sendChannelMessage,
  LOG_CHANNEL_ID,
  getDebugMatchResultsEmbed,
} from '@bf2-matchmaking/discord';
import { mapToKeyhashes } from '@bf2-matchmaking/utils/src/round-utils';
import { hasNotKeyhash } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import { get, setHash } from '@bf2-matchmaking/redis';
import { Match } from '@bf2-matchmaking/redis/src/types';
import { validateServerInfoSafe } from '@bf2-matchmaking/redis/src/validate';

export const finishMatch = async (matchId: string) => {
  const { data: updatedMatch, error } = await client().updateMatch(Number(matchId), {
    status: MatchStatus.Finished,
  });
  if (error) {
    logErrorMessage(`Match ${matchId}:  Failed to finish`, error);
    return;
  }

  try {
    if (updatedMatch.rounds.length === 0) {
      await client()
        .updateMatch(updatedMatch.id, {
          status: MatchStatus.Closed,
          closed_at: DateTime.now().toISO(),
        })
        .then(verifySingleResult);
      logMessage(
        `Match ${updatedMatch.id} has no rounds, closing match without creating results.`,
        {
          match: updatedMatch,
        }
      );
      return;
    }

    await closeMatch(updatedMatch);
  } catch (e) {
    logErrorMessage(`Match ${updatedMatch.id} failed to close`, e);
  }
};
export const closeMatch = async (match: MatchesJoined) => {
  let errors = validateMatch(match);

  let fixedMatch;
  if (errors.includes('MISSING_PLAYERS')) {
    fixedMatch = await fixMissingMatchPlayers(match);
    if (fixedMatch) {
      errors = validateMatch(fixedMatch);
    }
  }

  if (errors.length > 0) {
    logMessage(`Match ${match.id} is not valid, no results created.`, {
      match,
      errors,
    });
    return { result: null, errors };
  }

  const results = await processResults(fixedMatch || match);

  await client()
    .updateMatch(match.id, {
      status: MatchStatus.Closed,
      closed_at: DateTime.now().toISO(),
    })
    .then(verifySingleResult);
  logChangeMatchStatus(MatchStatus.Closed, match.id, { match, results });
  return { results, errors: null };
};

function validateMatch(match: MatchesJoined): Array<MatchProcessError> {
  const errors: Array<MatchProcessError> = [];
  if (match.config.maps * 2 < match.rounds.length) {
    errors.push('EXTRA_ROUNDS');
  }
  if (match.config.maps * 2 > match.rounds.length) {
    errors.push('MISSING_ROUNDS');
  }
  if (!validateMatchPlayers(match)) {
    errors.push('MISSING_PLAYERS');
  }
  return errors;
}

function validateMatchPlayers(match: MatchesJoined) {
  const playerKeys = mapToKeyhashes(match.rounds);

  return match.players.every(
    (player) => player.keyhash && playerKeys.includes(player.keyhash)
  );
}

export async function processResults(match: MatchesJoined) {
  const [resultsHome, resultsAway] = calculateMatchResults(match);
  const data = await client()
    .createMatchResult(resultsHome, resultsAway)
    .then(verifyResult);

  let playerResults = calculatePlayerResults(match);

  if (match.config.type === 'Mix') {
    playerResults = playerResults
      .map(withMixRatingIncrement(match, resultsHome, resultsAway))
      .map(withJoinTime(match));
  }

  await client()
    .createMatchPlayerResults(...playerResults)
    .then(verifyResult);

  const updatedRatings = await updatePlayerRatings(playerResults, match.config.id);
  logMessage(`Match ${match.id} results created`, {
    match,
    resultsHome,
    resultsAway,
    playerResults,
    updatedRatings,
  });
  if (isDiscordMatch(match)) {
    await sendChannelMessage(match.config.channel, {
      embeds: [getMatchResultsEmbed(match, [data[0], data[1]])],
    });
  }
  if (match.config.type === 'Mix') {
    await sendChannelMessage(LOG_CHANNEL_ID, {
      embeds: [getDebugMatchResultsEmbed(match, [data[0], data[1]], playerResults)],
    });
  }

  return data;
}

export const hasPlayedAllRounds = (config: MatchConfigsRow, roundsPlayed: number) =>
  roundsPlayed >= config.maps * 2;

export const isServerEmptied = (roundsPlayed: number, si: ServerInfo) =>
  roundsPlayed > 0 && si.connectedPlayers === '0';

export const isFirstTimeFullServer = (
  match: MatchesJoined,
  si: ServerInfo,
  roundsPlayed: number
) => Number(si.connectedPlayers) === match.players.length && roundsPlayed === 0;

export const isOngoingRound = (si: ServerInfo) => {
  si.currentGameStatus;
  if (parseInt(si.roundTime) >= parseInt(si.timeLimit)) {
    return false;
  }

  if (parseInt(si.team1_tickets) === 0 || parseInt(si.team2_tickets) === 0) {
    return false;
  }

  return true;
};

export async function updateMatchServer(matchId: number, serverAddress: string) {
  info(
    'updateMatchServer',
    `Match ${matchId}: Updating match server with ip ${serverAddress}`
  );
  await client().deleteAllMatchServers(matchId);
  const result = await client().createMatchServers(matchId, {
    server: serverAddress,
  });
  if (result.error) {
    error('updateMatchServer', result.error);
  }
  return result;
}

export async function fixMissingMatchPlayers(match: MatchesJoined) {
  const keyHashes = mapToKeyhashes(match.rounds);
  const orphanKeys = keyHashes.filter(hasNotKeyhash(match));
  const orphanPlayers = match.players.filter(
    (p) => !(p.keyhash && keyHashes.includes(p.keyhash))
  );

  if (orphanPlayers.length === 1 && orphanKeys.length === 1) {
    const player = orphanPlayers[0];
    await client().updatePlayer(player.id, { keyhash: orphanKeys[0] });

    const { data } = await client().getMatch(match.id);
    logMessage(`Match ${match.id}: Fixed missing player`, {
      player,
      keyhash: orphanKeys[0],
      match: data,
    });

    return data;
  }
  return null;
}

export async function setMatchLiveAt(matchId: number) {
  const live_at = DateTime.utc().toISO();
  verbose('setMatchLiveAt', `Match ${matchId}: Live at ${live_at}`);
  await client().updateMatch(matchId, { live_at }).then(verifySingleResult);
  await setHash<Match>('match', matchId, { live_at });
}

export async function broadcastWarmUpStarted(match: MatchesJoined, address: string) {
  const serverInfo = await get(`server:${address}:info`).then(validateServerInfoSafe);
  if (isDiscordMatch(match) && serverInfo) {
    await sendChannelMessage(match.config.channel, {
      embeds: [getWarmUpStartedEmbed(match.id, address, serverInfo)],
    });
  }
}
