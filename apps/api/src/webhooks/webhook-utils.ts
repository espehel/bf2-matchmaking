import {
  DiscordConfig,
  isDiscordConfig,
  isMatchesRow,
  isMatchServersRow,
  MatchesRow,
  MatchServersRow,
  WEBHOOK_POSTGRES_CHANGES_TYPE,
  WebhookPostgresDeletePayload,
  WebhookPostgresDeleteTypeCheckedPayload,
  WebhookPostgresInsertPayload,
  WebhookPostgresUpdatePayload,
} from '@bf2-matchmaking/types';

export function isDiscordConfigsInsert(
  payload: unknown
): payload is WebhookPostgresInsertPayload<DiscordConfig> {
  return isInsertPayload(payload) && isDiscordConfig(payload.record);
}
export function isDiscordConfigsDelete(
  payload: unknown
): payload is WebhookPostgresDeletePayload<DiscordConfig> & {
  old_record: DiscordConfig;
} {
  return isDeletePayload(payload) && isDiscordConfig(payload.old_record);
}
export function isDiscordConfigsUpdate(
  payload: unknown
): payload is WebhookPostgresUpdatePayload<DiscordConfig> {
  return isUpdatePayload(payload) && isDiscordConfig(payload.record);
}

export function isMatchesUpdate(payload: unknown): payload is Omit<
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
export function isMatchesInsert(
  payload: unknown
): payload is WebhookPostgresInsertPayload<MatchesRow> {
  return isInsertPayload(payload) && isMatchesRow(payload.record);
}
export function isInsertPayload<T extends Record<string, string>>(
  payload: unknown
): payload is WebhookPostgresInsertPayload<T> {
  const casted = payload as WebhookPostgresInsertPayload<T>;
  return Boolean(casted.type === WEBHOOK_POSTGRES_CHANGES_TYPE.INSERT);
}

export function isUpdatePayload<T extends Record<string, string>>(
  payload: unknown
): payload is WebhookPostgresUpdatePayload<T> {
  const casted = payload as WebhookPostgresUpdatePayload<T>;
  return Boolean(casted.type === WEBHOOK_POSTGRES_CHANGES_TYPE.UPDATE);
}

export function isDeletePayload<T extends Record<string, string>>(
  payload: unknown
): payload is WebhookPostgresDeletePayload<T> {
  const casted = payload as WebhookPostgresDeletePayload<T>;
  return Boolean(casted.type === WEBHOOK_POSTGRES_CHANGES_TYPE.DELETE);
}
export function isMatchServersInsert(
  payload: unknown
): payload is WebhookPostgresInsertPayload<MatchServersRow> {
  return isInsertPayload(payload) && isMatchServersRow(payload.record);
}
export function isMatchServersDelete(
  payload: unknown
): payload is WebhookPostgresDeleteTypeCheckedPayload<MatchServersRow> {
  return isDeletePayload(payload) && isMatchServersRow(payload.old_record);
}
