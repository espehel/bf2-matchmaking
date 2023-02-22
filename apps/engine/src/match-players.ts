import { info, warn } from '@bf2-matchmaking/logging';
import {
  isDiscordMatch,
  MatchesJoined,
  MatchPlayersRow,
  MatchStatus,
  WebhookPostgresUpdatePayload,
} from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import {
  sendMatchInfoMessage,
  sendMatchJoinMessage,
  sendMatchLeaveMessage,
} from './message-service';
import moment from 'moment';
import { getDraftStep, SUMMONING_DURATION } from '@bf2-matchmaking/utils';

export const handleInsertedMatchPlayer = async (matchPlayer: MatchPlayersRow) => {
  info('handleInsertedMatchPlayer', `Player ${matchPlayer.player_id} joined.`);
  const match = await client().getMatch(matchPlayer.match_id).then(verifySingleResult);

  if (match.status !== MatchStatus.Open) {
    warn(
      'handleInsertedMatchPlayer',
      `Player ${matchPlayer.player_id} joined a not open match(status="${match.status}").`
    );
  }

  if (match.players.length === match.size) {
    info('handleInsertedMatchPlayer', `Setting match ${match.id} status to "summoning".`);
    return await setMatchSummoning(match);
  }

  if (match.players.length > match.size) {
    warn(
      'handleInsertedMatchPlayer',
      `Player ${matchPlayer.player_id} joined full match ${match.id}. Removing player.`
    );
    return client().deleteMatchPlayer(match.id, matchPlayer.player_id);
  }

  if (isDiscordMatch(match)) {
    return await sendMatchJoinMessage(matchPlayer, match);
  }
};

export const handleUpdatedMatchPlayer = async (
  payload: WebhookPostgresUpdatePayload<MatchPlayersRow>
) => {
  if (isReadyEvent(payload)) {
    return handlePlayerReady(payload);
  }
  if (isPickEvent(payload)) {
    return handlePlayerPicked(payload);
  }
};

export const handleDeletedMatchPlayer = async (
  oldMatchPlayer: Partial<MatchPlayersRow>
) => {
  info('handleDeletedMatchPlayer', `Player ${oldMatchPlayer.player_id} left.`);

  const match = await client().getMatch(oldMatchPlayer.match_id).then(verifySingleResult);

  if (isDiscordMatch(match)) {
    return await sendMatchLeaveMessage(oldMatchPlayer, match);
  }
};
const setMatchSummoning = async (match: MatchesJoined) => {
  await client()
    .updateMatch(match.id, {
      status: MatchStatus.Summoning,
      ready_at: moment().add(SUMMONING_DURATION, 'ms').toISOString(),
    })
    .then(verifySingleResult);
};
const setMatchDrafting = async (match: MatchesJoined) => {
  await client()
    .updateMatch(match.id, { status: MatchStatus.Drafting })
    .then(verifySingleResult);
};

const setMatchStatusOngoing = async (match: MatchesJoined) => {
  client()
    .updateMatch(match.id, {
      status: MatchStatus.Ongoing,
      started_at: new Date().toISOString(),
    })
    .then(verifySingleResult);
};

const isPickEvent = (payload: WebhookPostgresUpdatePayload<MatchPlayersRow>) =>
  payload.old_record.team === null &&
  (payload.record.team === 'a' || payload.record.team === 'b');
const isReadyEvent = (payload: WebhookPostgresUpdatePayload<MatchPlayersRow>) =>
  !payload.old_record.ready && payload.record.ready;

const isReadyMatch = (match: MatchesJoined) =>
  match.status === MatchStatus.Summoning && match.teams.every((player) => player.ready);

const handlePlayerPicked = async (
  payload: WebhookPostgresUpdatePayload<MatchPlayersRow>
) => {
  info(
    'handleUpdatedMatchPlayer',
    `Player ${payload.record.player_id} joined team ${payload.record.team}.`
  );
  const match = await client().getMatch(payload.record.match_id).then(verifySingleResult);

  if (match.status !== MatchStatus.Drafting) {
    warn(
      'handleUpdatedMatchPlayer',
      `Player ${payload.record.player_id} joined team "${payload.record.team}" for match not in drafting(id="${match.id}", status="${match.status}").`
    );
    return;
  }

  const { pool, team } = getDraftStep(match);
  if (pool.length === 1) {
    return client().updateMatchPlayer(match.id, pool[0].id, { team });
  }

  if (pool.length === 0) {
    info('handleUpdatedMatchPlayer', `Setting match ${match.id} status to "Ongoing".`);
    await setMatchStatusOngoing(match);
    return await handleNextMatch(match);
  }

  if (isDiscordMatch(match) && !payload.record.captain) {
    return sendMatchInfoMessage(match);
  }
};

const handlePlayerReady = async (
  payload: WebhookPostgresUpdatePayload<MatchPlayersRow>
) => {
  const match = await client().getMatch(payload.record.match_id).then(verifySingleResult);
  if (isReadyMatch(match)) {
    await setMatchDrafting(match);
  } else if (isDiscordMatch(match)) {
    await sendMatchInfoMessage(match);
  }
};

const handleNextMatch = async (match: MatchesJoined) => {
  const { data: config } = await client().getMatchConfigByChannelId(
    match.channel?.channel_id
  );
  if (config) {
    info('handleUpdatedMatchPlayer', `Creating new match with config ${config.id}`);
    await client().services.createMatchFromConfig(config);
  }
};
