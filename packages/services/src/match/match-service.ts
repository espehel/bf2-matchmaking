import {
  client,
  createServiceClient,
  ResolvableSupabaseClient,
  verifyResult,
} from '@bf2-matchmaking/supabase';
import {
  isDiscordMatch,
  isNotNull,
  MatchConfigsRow,
  MatchesJoined,
  MatchResultsInsert,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
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
import { fixMissingMatchPlayers, updatePlayerRatings } from '../player-service';
import { getGatherPlayer } from '@bf2-matchmaking/redis/gather';
import { buildDraftWithConfig } from '../draft-service';
import { toMatchPlayer } from '@bf2-matchmaking/utils';
import { validateMatch } from './match-utilities';
import { createMatchApi } from './match-api';

export function createMatchService(matchApi: ReturnType<typeof createMatchApi>) {
  async function createMatch(queuePlayers: Array<string>, config: MatchConfigsRow) {
    const summoningMatch = await matchApi.create({
      config: config.id,
      status: MatchStatus.Summoning,
    });

    const players = (await Promise.all(queuePlayers.map(getGatherPlayer))).filter(
      isNotNull
    );

    const matchPlayers = await buildDraftWithConfig(
      players.map(toMatchPlayer(summoningMatch.id)),
      config
    );
    return matchApi.update(summoningMatch.id).setTeams(matchPlayers).commit();
  }

  const finishMatch = async (matchId: string | number) => {
    try {
      const match = await matchApi.get(matchId);
      if (match.rounds.length === 0) {
        const removedMatch = await matchApi.remove(matchId, MatchStatus.Closed);
        logMessage(
          `Match ${match.id} has no rounds, closing match without creating results.`,
          {
            removedMatch,
          }
        );
        return;
      }

      const updatedMatch = await matchApi.update(matchId).commit({
        status: MatchStatus.Finished,
      });

      await closeMatch(updatedMatch);
    } catch (e) {
      logErrorMessage(`Match ${matchId} failed to finish`, e);
    }
  };
  async function closeMatch(match: MatchesJoined) {
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

    const removedMatch = await matchApi.remove(match.id, MatchStatus.Closed);
    logMessage(`Match ${match.id} closed with results`, { removedMatch, results });
    return { results, errors: null };
  }

  async function processResults(match: MatchesJoined) {
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

    const updatedPlayerRatings = await updatePlayerRatings(
      playerResults,
      match.config.id
    );
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

  async function updateMatchRating(matchResult: MatchResultsInsert, config: number) {
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

  return {
    createMatch,
    finishMatch,
    closeMatch,
    processResults,
    updateMatchRating,
  };
}
