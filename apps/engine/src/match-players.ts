import { info, warn } from '@bf2-matchmaking/logging';
import {
  DraftType,
  isDiscordMatch,
  MatchesJoined,
  MatchPlayersRow,
  MatchStatus,
  WebhookPostgresUpdatePayload,
} from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { getDraftStep } from '@bf2-matchmaking/utils';
import {
  reopenMatch,
  setMatchDrafting,
  setMatchStatusOngoing,
  setMatchSummoning,
} from './services/match-service';
import {
  removePlayerFromOtherMatches,
  setPlayerExpireTimer,
} from './services/match-player-service';
import {
  pushInfoMessage,
  pushJoinMessage,
  pushLeaveMessage,
} from './utils/message-queue';

export const handleInsertedMatchPlayer = async (matchPlayer: MatchPlayersRow) => {
  info('handleInsertedMatchPlayer', `Player ${matchPlayer.player_id} joined.`);
  const match = await client().getMatch(matchPlayer.match_id).then(verifySingleResult);

  if (match.status !== MatchStatus.Open) {
    warn(
      'handleInsertedMatchPlayer',
      `Player ${matchPlayer.player_id} joined a not open match(status="${match.status}").`
    );
  }

  if (match.status === MatchStatus.Open && match.players.length === match.config.size) {
    info('handleInsertedMatchPlayer', `Setting match ${match.id} status to "summoning".`);
    return await setMatchSummoning(match);
  }

  if (match.players.length > match.config.size) {
    warn(
      'handleInsertedMatchPlayer',
      `Player ${matchPlayer.player_id} joined full match ${match.id}. Removing player.`
    );
    return client().deleteMatchPlayer(match.id, matchPlayer.player_id);
  }

  if (matchPlayer.expire_at) {
    setPlayerExpireTimer(matchPlayer);
  }

  if (isDiscordMatch(match)) {
    return pushJoinMessage(match, matchPlayer.player_id);
  }
};

export const handleUpdatedMatchPlayer = async (
  payload: WebhookPostgresUpdatePayload<MatchPlayersRow>
) => {
  if (isRenewExpireEvent(payload)) {
    setPlayerExpireTimer(payload.record);
  }
  if (isReadyEvent(payload)) {
    return handlePlayerReady(payload);
  }
  if (isPickEvent(payload)) {
    return handlePlayerPicked(payload);
  }

  const match = await client().getMatch(payload.record.match_id).then(verifySingleResult);
  if (
    isDiscordMatch(match) &&
    match.status === MatchStatus.Drafting &&
    isCaptainChangeEvent(payload)
  ) {
    return pushInfoMessage(match);
  }
};

export const handleDeletedMatchPlayer = async (
  oldMatchPlayer: Partial<MatchPlayersRow>
) => {
  info('handleDeletedMatchPlayer', `Player ${oldMatchPlayer.player_id} left.`);

  const match = await client().getMatch(oldMatchPlayer.match_id).then(verifySingleResult);

  if (match.status === MatchStatus.Summoning) {
    await reopenMatch(match);
  }

  if (isDiscordMatch(match)) {
    return pushLeaveMessage(match, oldMatchPlayer.player_id);
  }
};

const isRenewExpireEvent = (payload: WebhookPostgresUpdatePayload<MatchPlayersRow>) =>
  payload.record.expire_at
    ? payload.old_record.expire_at !== payload.record.expire_at
    : false;
const isPickEvent = (payload: WebhookPostgresUpdatePayload<MatchPlayersRow>) =>
  payload.old_record.team === null &&
  !isCaptainChangeEvent(payload) &&
  (payload.record.team === 'a' || payload.record.team === 'b');
const isCaptainChangeEvent = (payload: WebhookPostgresUpdatePayload<MatchPlayersRow>) =>
  !payload.old_record.captain && payload.record.captain;
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
    return await setMatchStatusOngoing(match);
  }

  if (
    isDiscordMatch(match) &&
    !payload.record.captain &&
    match.config.draft === DraftType.Captain
  ) {
    return pushInfoMessage(match);
  }
};

const handlePlayerReady = async (
  payload: WebhookPostgresUpdatePayload<MatchPlayersRow>
) => {
  await removePlayerFromOtherMatches(payload.record);
  const match = await client().getMatch(payload.record.match_id).then(verifySingleResult);
  if (isReadyMatch(match)) {
    await setMatchDrafting(match);
  } else if (isDiscordMatch(match)) {
    await pushInfoMessage(match);
  }
};
