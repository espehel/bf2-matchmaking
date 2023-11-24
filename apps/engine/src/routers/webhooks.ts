import Router from '@koa/router';
import {
  DiscordConfig,
  isDiscordConfig,
  isMatchesRow,
  MatchesRow,
  MatchStatus,
  WEBHOOK_POSTGRES_CHANGES_TYPE,
  WebhookPostgresDeletePayload,
  WebhookPostgresInsertPayload,
  WebhookPostgresUpdatePayload,
} from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import matches from '../state/matches';
import { info } from '@bf2-matchmaking/logging';
import { api } from '@bf2-matchmaking/utils';
import { handleMatchStatusUpdate } from '../handlers/match-status';

export const webhooksRouter = new Router({
  prefix: '/webhooks',
});

webhooksRouter.post('/matches', async (ctx) => {
  const { body } = ctx.request;
  if (isMatchesInsert(body)) {
    info('routers/matches', `Match ${body.record.id} ${body.record.status}`);
    const match = await client().getMatch(body.record.id).then(verifySingleResult);
    if (match.status === MatchStatus.Scheduled) {
      matches.pushScheduledMatch(match);
    }
    if (match.status === MatchStatus.Ongoing) {
      matches.pushActiveMatch(match);
    }
    ctx.status = 202;
    return;
  }

  if (isMatchesUpdate(body)) {
    const { old_record, record } = body;
    info('routers/matches', `Match ${record.id} ${old_record.status}->${record.status}`);
    if (old_record.status !== record.status) {
      const match = await client().getMatch(body.record.id).then(verifySingleResult);
      await handleMatchStatusUpdate(match, old_record.status as MatchStatus);
      ctx.status = 202;
      return;
    }
    ctx.status = 204;
    return;
  }

  ctx.status = 400;
  ctx.body = { message: 'Invalid payload' };
});

webhooksRouter.post('/match_configs', async (ctx) => {
  const { body } = ctx.request;
  if (isDiscordConfigsInsert(body) || isDiscordConfigsUpdate(body)) {
    await api.bot().postChannelsListeners(body.record.channel);
    ctx.status = 202;
    return;
  }
  if (isDiscordConfigsDelete(body)) {
    await api.bot().deleteChannelsListeners(body.old_record.channel);
    ctx.status = 202;
    return;
  }
  ctx.status = 400;
  ctx.body = { message: 'Invalid payload' };
});

function isDiscordConfigsInsert(
  payload: unknown
): payload is WebhookPostgresInsertPayload<DiscordConfig> {
  return isInsertPayload(payload) && isDiscordConfig(payload.record);
}
function isDiscordConfigsDelete(
  payload: unknown
): payload is WebhookPostgresDeletePayload<DiscordConfig> & {
  old_record: DiscordConfig;
} {
  return isDeletePayload(payload) && isDiscordConfig(payload.old_record);
}
function isDiscordConfigsUpdate(
  payload: unknown
): payload is WebhookPostgresUpdatePayload<DiscordConfig> {
  return isUpdatePayload(payload) && isDiscordConfig(payload.record);
}

function isMatchesUpdate(payload: unknown): payload is Omit<
  WebhookPostgresUpdatePayload<MatchesRow>,
  'old_record'
> & {
  old_record: MatchesRow;
} {
  return (
    isUpdatePayload(payload) &&
    isMatchesRow(payload.record) &&
    isMatchesRow(payload.old_record)
  );
}
function isMatchesInsert(
  payload: unknown
): payload is WebhookPostgresInsertPayload<MatchesRow> {
  return isInsertPayload(payload) && isMatchesRow(payload.record);
}
function isInsertPayload<T extends Record<string, string>>(
  payload: unknown
): payload is WebhookPostgresInsertPayload<T> {
  const casted = payload as WebhookPostgresInsertPayload<T>;
  return Boolean(casted.type === WEBHOOK_POSTGRES_CHANGES_TYPE.INSERT);
}

function isUpdatePayload<T extends Record<string, string>>(
  payload: unknown
): payload is WebhookPostgresUpdatePayload<T> {
  const casted = payload as WebhookPostgresUpdatePayload<T>;
  return Boolean(casted.type === WEBHOOK_POSTGRES_CHANGES_TYPE.UPDATE);
}

function isDeletePayload<T extends Record<string, string>>(
  payload: unknown
): payload is WebhookPostgresDeletePayload<T> {
  const casted = payload as WebhookPostgresDeletePayload<T>;
  return Boolean(casted.type === WEBHOOK_POSTGRES_CHANGES_TYPE.DELETE);
}
