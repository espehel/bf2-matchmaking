import {
  logChangeMatchStatus,
  logErrorMessage,
  logMessage,
  logSupabaseError,
} from '@bf2-matchmaking/logging';
import {
  isNotNull,
  isServerMatch,
  MatchesJoined,
  MatchStatus,
  RoundsInsert,
  RoundsRow,
  ServerInfo,
} from '@bf2-matchmaking/types';
import { client, verifyResult } from '@bf2-matchmaking/supabase';
import { LiveMatch } from './LiveMatch';
import moment from 'moment/moment';
import {
  calculateMatchResults,
  calculatePlayerResults,
  getPlayerRoundStats,
  withRatingIncrement,
} from '@bf2-matchmaking/utils/src/results-utils';
import { updatePlayerRatings } from './players';
import { getMatchResultsEmbed, sendChannelMessage } from '@bf2-matchmaking/discord';

export const closeMatch = async (
  liveMatch: LiveMatch,
  reason: string,
  rounds: Array<RoundsRow>
) => {
  logChangeMatchStatus(
    MatchStatus.Closed,
    reason,
    liveMatch.match,
    rounds,
    liveMatch.liveRound
  );
  const { data, error } = await client().updateMatch(liveMatch.match.id, {
    status: MatchStatus.Closed,
  });
  if (error) {
    logSupabaseError('Failed to close match', error);
    return;
  }

  if (!validateMatch(data)) {
    logMessage(`Match ${data.id} is not valid, no results created.`, { match: data });
    return;
  }

  try {
    await processResults(data);
  } catch (e) {
    logErrorMessage('Failed to process results', e);
  }

  return data;
};

function validateMatch(match: MatchesJoined) {
  if (!(match.rounds.length === 2 || match.rounds.length === 4)) {
    return false;
  }
  if (!validateMatchPlayers(match)) {
    return false;
  }
  return true;
}

function validateMatchPlayers(match: MatchesJoined) {
  const playerKeys = match.rounds
    .map(getPlayerRoundStats)
    .filter(isNotNull)
    .flatMap((stats) => Object.keys(stats));

  return match.players.every(
    (player) => player.keyhash && playerKeys.includes(player.keyhash)
  );
}

export async function processResults(match: MatchesJoined) {
  const [resultsA, resultsB] = calculateMatchResults(match);
  const data = await client().createMatchResult(resultsA, resultsB).then(verifyResult);

  const playerResults = calculatePlayerResults(match).map(
    withRatingIncrement(match, resultsA.is_winner ? 'a' : 'b')
  );

  await client()
    .createMatchPlayerResults(...playerResults)
    .then(verifyResult);

  await updatePlayerRatings(playerResults);
  logMessage(`Match ${match.id} results created`, { match });

  await sendChannelMessage('1046889100369739786', {
    embeds: [getMatchResultsEmbed(match, [data[0], data[1]])],
  });
}

export const deleteMatch = async (
  liveMatch: LiveMatch,
  reason: string,
  rounds: Array<RoundsRow>
) => {
  logChangeMatchStatus(
    MatchStatus.Closed,
    reason,
    liveMatch.match,
    rounds,
    liveMatch.liveRound
  );
  const { data, error } = await client().updateMatch(liveMatch.match.id, {
    status: MatchStatus.Deleted,
  });
  if (error) {
    logSupabaseError('Failed to delete match', error);
  }
  return data;
};

export const hasPlayedAllRounds = (rounds: Array<RoundsInsert>) => rounds.length >= 4;

export const isServerEmptied = (rounds: Array<RoundsInsert>, si: ServerInfo) =>
  rounds.length > 0 && si.connectedPlayers === '0';

export const isFirstTimeFullServer = (
  match: MatchesJoined,
  si: ServerInfo,
  rounds: Array<RoundsInsert>
) => Number(si.connectedPlayers) === match.players.length && rounds.length === 0;

export const isOngoingRound = (si: ServerInfo) => {
  if (parseInt(si.roundTime) >= parseInt(si.timeLimit)) {
    return false;
  }

  if (parseInt(si.team1_tickets) === 0 || parseInt(si.team2_tickets) === 0) {
    return false;
  }

  return true;
};

export async function updateLiveAt(liveMatch: LiveMatch) {
  if (!liveMatch.match.live_at) {
    const { data } = await client().updateMatch(liveMatch.match.id, {
      live_at: moment().toISOString(),
    });
    if (data && isServerMatch(data)) {
      liveMatch.match = data;
    }
  }
}
