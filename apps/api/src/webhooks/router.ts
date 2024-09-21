import Router from '@koa/router';
import { info } from '@bf2-matchmaking/logging';
import {
  handleMatchInserted,
  handleMatchScheduledAtUpdate,
  handleMatchStatusUpdate,
} from './match-handler';
import {
  isDeletePayload,
  isDiscordConfigsDelete,
  isDiscordConfigsInsert,
  isDiscordConfigsUpdate,
  isMatchesInsert,
  isMatchesUpdate,
  isMatchServersDelete,
  isMatchServersInsert,
} from './webhook-utils';
import { addMatchServer, removeMatchServer } from '@bf2-matchmaking/redis/matches';
import { isMatchServersRow } from '@bf2-matchmaking/types';

export const webhooksRouter = new Router({
  prefix: '/webhooks',
});

webhooksRouter.post('/matches', async (ctx) => {
  const { body } = ctx.request;
  if (isMatchesInsert(body)) {
    info('routers/matches', `Match ${body.record.id} ${body.record.status}`);
    await handleMatchInserted(body.record);
    ctx.status = 202;
    return;
  }

  if (isMatchesUpdate(body)) {
    const { old_record, record } = body;
    info('routers/matches', `Match ${record.id} ${old_record.status}->${record.status}`);

    let dirty = false;
    if (old_record.status !== record.status) {
      await handleMatchStatusUpdate(record);
      dirty = true;
    }
    if (old_record.scheduled_at !== record.scheduled_at) {
      dirty = true;
      await handleMatchScheduledAtUpdate(record);
    }

    ctx.status = dirty ? 202 : 204;
    return;
  }

  ctx.status = 400;
  ctx.body = { message: 'Invalid payload' };
});

webhooksRouter.post('/match_configs', async (ctx) => {
  const { body } = ctx.request;
  if (isDiscordConfigsInsert(body) || isDiscordConfigsUpdate(body)) {
    // TODO
    //await api.bot().postChannelsListeners(body.record.channel);
    ctx.status = 202;
    return;
  }
  if (isDiscordConfigsDelete(body)) {
    // TODO
    //await api.bot().deleteChannelsListeners(body.old_record.channel);
    ctx.status = 202;
    return;
  }
  ctx.status = 400;
  ctx.body = { message: 'Invalid payload' };
});

webhooksRouter.post('/match_servers', async (ctx) => {
  const { body } = ctx.request;
  if (isMatchServersInsert(body)) {
    await addMatchServer(body.record.id, body.record.server);
  } else if (isMatchServersDelete(body)) {
    await removeMatchServer(body.old_record.id, body.old_record.server);
  } else {
    ctx.status = 400;
    ctx.body = { message: 'Invalid payload' };
  }
  ctx.status = 202;
});
