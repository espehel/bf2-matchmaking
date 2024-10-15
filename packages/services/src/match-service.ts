import { client, verifyResult } from '@bf2-matchmaking/supabase';
import {
  isDiscordMatch,
  MatchesJoined,
  MatchesRow,
  MatchProcessError,
  MatchResultsInsert,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { DateTime } from 'luxon';
import { mapToKeyhashes } from '@bf2-matchmaking/utils/src/round-utils';
import {
  calculateMatchResults,
  calculatePlayerResults,
  withJoinTime,
  withMixRatingIncrement,
} from '@bf2-matchmaking/utils/src/results-utils';
import {
  getDebugMatchResultsEmbed,
  getMatchResultsEmbed,
  LOG_CHANNEL_ID,
  sendChannelMessage,
} from '@bf2-matchmaking/discord';
import { fixMissingMatchPlayers, updatePlayerRatings } from './player-service';
import { setMatchLive } from '@bf2-matchmaking/redis/matches';
import { Match } from './Match';

export const finishMatch = async (matchId: string | number) => {
  try {
    const match = await Match.get(matchId);
    if (match.rounds.length === 0) {
      const removedMatch = await Match.remove(matchId, MatchStatus.Closed);
      logMessage(
        `Match ${match.id} has no rounds, closing match without creating results.`,
        {
          removedMatch,
        }
      );
      return;
    }

    const updatedMatch = await Match.update(matchId).commit({
      status: MatchStatus.Finished,
    });

    await closeMatch(updatedMatch);
  } catch (e) {
    logErrorMessage(`Match ${matchId} failed to finish`, e);
  }
};
export async function closeMatch(match: MatchesJoined) {
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

  const removedMatch = await Match.remove(match.id, MatchStatus.Closed);
  logMessage(`Match ${match.id} closed with results`, { removedMatch, results });
  return { results, errors: null };
}

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

  const updatedPlayerRatings = await updatePlayerRatings(playerResults, match.config.id);
  const updatedMatchRatings = await Promise.all([
    updateMatchRating(resultsHome, match.config.id),
    updateMatchRating(resultsAway, match.config.id),
  ]);
  logMessage(`Match ${match.id} results created`, {
    match,
    resultsHome,
    resultsAway,
    playerResults,
    updatedPlayerRatings,
    updatedMatchRatings,
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

export async function updateMatchRating(matchResult: MatchResultsInsert, config: number) {
  if (matchResult.rating_inc === null || matchResult.rating_inc === undefined) {
    return null;
  }
  const { data, error } = await client().getChallengeTeam(matchResult.team, config);
  if (error) {
    return error;
  }
  const res = await client().updateChallengeTeamRating(
    data.team_id,
    data.config,
    data.rating + matchResult.rating_inc,
    data.match_count + 1
  );
  if (res.error) {
    return res.error;
  }
  return res.data;
}

export async function createPendingLiveMatch(match: MatchesRow | MatchesJoined) {
  const liveMatch = {
    state: 'pending',
    roundsPlayed: '0',
    pendingSince: DateTime.now().toISO(),
  } as const;
  await setMatchLive(match.id, liveMatch);
  return liveMatch;
}
