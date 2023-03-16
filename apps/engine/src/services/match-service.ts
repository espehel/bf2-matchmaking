import { DiscordMatch, MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import moment from 'moment/moment';
import { SUMMONING_DURATION } from '@bf2-matchmaking/utils';
import { error, info } from '@bf2-matchmaking/logging';

export const setMatchSummoning = async (match: MatchesJoined) => {
  await client()
    .updateMatch(match.id, {
      status: MatchStatus.Summoning,
      ready_at: moment().add(SUMMONING_DURATION, 'ms').toISOString(),
    })
    .then(verifySingleResult);
};
export const setMatchDrafting = async (match: MatchesJoined) => {
  await client()
    .updateMatch(match.id, { status: MatchStatus.Drafting })
    .then(verifySingleResult);
};

export const setMatchStatusOngoing = async (match: MatchesJoined) => {
  client()
    .updateMatch(match.id, {
      status: MatchStatus.Ongoing,
      started_at: new Date().toISOString(),
    })
    .then(verifySingleResult);
};

export const createNextMatchFromConfig = async (match: DiscordMatch) => {
  try {
    info('handleNewMatch', `Fetching match ${match.id} config.`);
    const config = await client()
      .getMatchConfigByChannelId(match.channel.channel_id)
      .then(verifySingleResult);

    const stagingMatches = await client()
      .getStagingMatchesByChannelId(config.channel.channel_id)
      .then(verifyResult);

    if (stagingMatches.length === 0) {
      info('handleNewMatch', `No matches for config ${config.id}, creating new!`);
      await client().services.createMatchFromConfig(config);
    }
  } catch (err) {
    error('handleNewMatch', err);
  }
};

export const reopenMatch = async (match: MatchesJoined) => {
  await client()
    .updateMatch(match.id, { status: MatchStatus.Open, ready_at: null })
    .then(verifySingleResult);
};
