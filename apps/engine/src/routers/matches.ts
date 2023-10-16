import Router from '@koa/router';
import {
  isMatchesRow,
  MatchesRow,
  WEBHOOK_POSTGRES_CHANGES_TYPE,
  WebhookPostgresInsertPayload,
  WebhookPostgresUpdatePayload,
} from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import matches from '../state/matches';

export const matchesRouter = new Router({
  prefix: '/matches',
});

matchesRouter.post('/', async (ctx) => {
  const { body } = ctx.request;

  if (isInsertPayload(body)) {
    const match = await client().getMatch(body.record.id).then(verifySingleResult);
    matches.pushMatch(match);
    ctx.status = 204;
    return;
  }

  if (isUpdatePayload(body)) {
    const { old_record, record } = body;
    if (old_record.status !== record.status) {
      const match = await client().getMatch(body.record.id).then(verifySingleResult);
      matches.pushMatch(match);
    }
    return;
  }

  ctx.status = 400;
  ctx.body = { message: 'Invalid payload' };
});

function isInsertPayload(
  payload: unknown
): payload is WebhookPostgresInsertPayload<MatchesRow> {
  const casted = payload as WebhookPostgresInsertPayload<MatchesRow>;
  return Boolean(
    casted.type === WEBHOOK_POSTGRES_CHANGES_TYPE.INSERT && isMatchesRow(casted.record)
  );
}

function isUpdatePayload(
  payload: unknown
): payload is WebhookPostgresUpdatePayload<MatchesRow> {
  const casted = payload as WebhookPostgresUpdatePayload<MatchesRow>;
  return Boolean(
    casted.type === WEBHOOK_POSTGRES_CHANGES_TYPE.UPDATE &&
      isMatchesRow(casted.record) &&
      isMatchesRow(casted.old_record)
  );
}
