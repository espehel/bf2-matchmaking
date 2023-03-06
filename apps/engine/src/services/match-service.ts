import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import moment from 'moment/moment';
import { SUMMONING_DURATION } from '@bf2-matchmaking/utils';
import { info } from '@bf2-matchmaking/logging';

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

export const createNextMatchFromConfig = async (match: MatchesJoined) => {
  const { data: config } = await client().getMatchConfigByChannelId(
    match.channel?.channel_id
  );
  if (config) {
    info('handleUpdatedMatchPlayer', `Creating new match with config ${config.id}`);
    await client().services.createMatchFromConfig(config);
  }
};

export const reopenMatch = async (match: MatchesJoined) => {
  await client()
    .updateMatch(match.id, { status: MatchStatus.Open, ready_at: null })
    .then(verifySingleResult);
};
