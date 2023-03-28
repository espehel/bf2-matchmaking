import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { info } from '@bf2-matchmaking/logging';
import {
  DraftType,
  isDiscordMatch,
  MatchesJoined,
  MatchesRow,
  MatchStatus,
  WebhookPostgresUpdatePayload,
} from '@bf2-matchmaking/types';
import {
  sendMatchInfoMessage,
  sendMatchSummoningMessage,
  sendSummoningDM,
} from './services/message-service';
import { createNextMatchFromConfig } from './services/match-service';
import {
  setMatchCaptains,
  setPlayerReadyTimer,
  setRandomTeams,
} from './services/match-player-service';

export const handleInsertedMatch = async (match: MatchesRow) => {
  info('handleInsertedMatch', `New match ${match.id}`);
  const matchJoined = await client().getMatch(match.id).then(verifySingleResult);
  if (isDiscordMatch(matchJoined)) {
    return sendMatchInfoMessage(matchJoined);
  }
};

export const handleUpdatedMatch = async (
  payload: WebhookPostgresUpdatePayload<MatchesRow>
) => {
  info(
    'handleUpdatedMatch',
    `Match ${payload.record.id} updated. ${payload.old_record.status} -> ${payload.record.status}`
  );
  const match = await client().getMatch(payload.record.id).then(verifySingleResult);
  if (isSummoningUpdate(payload)) {
    return await handleMatchSummon(match);
  }
  if (isDraftingUpdate(payload)) {
    return await handleMatchDraft(match);
  }

  if (isReopenUpdate(payload)) {
    await handleMatchReopen(match);
  }
  if (
    isDiscordMatch(match) &&
    (isOngoingUpdate(payload) || isClosedUpdate(payload) || isDeletedUpdate(payload))
  ) {
    await createNextMatchFromConfig(match);
  }
  if (isDiscordMatch(match)) {
    return sendMatchInfoMessage(match);
  }
};

export const handleDeletedMatch = (oldMatch: Partial<MatchesRow>) => {
  info('handleDeletedMatch', `Match ${oldMatch.id} removed`);
};

export const handleMatchReopen = async (match: MatchesJoined) => {
  info('handleMatchReopen', `Match ${match.id} reopened`);
  await client().updateMatchPlayersForMatchId(match.id, match.teams, {
    team: null,
    captain: false,
    ready: false,
  });
};

export const handleMatchSummon = async (match: MatchesJoined) => {
  info('handleMatchSummon', `Match ${match.id} is summoning`);

  setPlayerReadyTimer(match);

  if (isDiscordMatch(match)) {
    await sendMatchSummoningMessage(match);
    await sendSummoningDM(match);

    // TODO: Create channel per match
    /*if (match.channel.staging_channel) {
      await api.bot().postMatchEvent(match.id, MatchEvent.Summon);
    }*/
  }
};

export const handleMatchDraft = async (match: MatchesJoined) => {
  // TODO: create channel per match
  /*try {
    if (isDiscordMatch(match) && match.channel.staging_channel) {
      const { error: err } = await api.bot().postMatchEvent(match.id, MatchEvent.Draft);
      if (err) {
        error('handleMatchDraft', err);
      }
    }
  } catch (err) {
    error('handleMatchDraft', err);
  }*/

  if (match.config.draft === DraftType.Random) {
    await setRandomTeams(match);
  }
  if (match.config.draft === DraftType.Captain) {
    await setMatchCaptains(match);
    const matchWithCaptains = await client().getMatch(match.id).then(verifySingleResult);
    if (isDiscordMatch(matchWithCaptains)) {
      await sendMatchInfoMessage(matchWithCaptains);
    }
  }
};

const isOngoingUpdate = ({
  record,
  old_record,
}: WebhookPostgresUpdatePayload<MatchesRow>) =>
  record.status === MatchStatus.Ongoing &&
  (old_record.status === MatchStatus.Drafting ||
    old_record.status === MatchStatus.Summoning);

const isDraftingUpdate = ({
  record,
  old_record,
}: WebhookPostgresUpdatePayload<MatchesRow>) =>
  record.status === MatchStatus.Drafting && old_record.status === MatchStatus.Summoning;

const isSummoningUpdate = ({
  record,
  old_record,
}: WebhookPostgresUpdatePayload<MatchesRow>) =>
  record.status === MatchStatus.Summoning && old_record.status === MatchStatus.Open;

const isReopenUpdate = ({
  record,
  old_record,
}: WebhookPostgresUpdatePayload<MatchesRow>) =>
  record.status === MatchStatus.Open &&
  (old_record.status === MatchStatus.Summoning ||
    old_record.status === MatchStatus.Drafting ||
    old_record.status === MatchStatus.Ongoing);

const isClosedUpdate = ({
  record,
  old_record,
}: WebhookPostgresUpdatePayload<MatchesRow>) =>
  record.status === MatchStatus.Closed && old_record.status !== MatchStatus.Closed;

const isDeletedUpdate = ({
  record,
  old_record,
}: WebhookPostgresUpdatePayload<MatchesRow>) =>
  record.status === MatchStatus.Deleted && old_record.status !== MatchStatus.Deleted;
