import Router from '@koa/router';
import { info, logMessage } from '@bf2-matchmaking/logging';
import {
  handleMatchInserted,
  handleMatchScheduledAtUpdate,
  handleMatchStatusUpdate,
} from './match-handler';
import {
  isDiscordConfigsDelete,
  isDiscordConfigsInsert,
  isDiscordConfigsUpdate,
  isMatchesInsert,
  isMatchesUpdate,
  isMatchServersDelete,
  isMatchServersInsert,
} from './webhook-utils';
import {
  addMatchServer,
  removeMatchServer,
  updateMatchProperties,
} from '@bf2-matchmaking/redis/matches';

export const webhooksRouter = new Router({
  prefix: '/webhooks',
});

webhooksRouter.post('/matches', async (ctx) => {
  const { body } = ctx.request;
  if (isMatchesInsert(body)) {
    // TODO this is not working for scheduled matches
    info('routers/matches', `Match ${body.record.id} ${body.record.status}`);
    await handleMatchInserted(body.record);
    ctx.status = 204;
    return;
  }

  if (isMatchesUpdate(body)) {
    const { old_record, record } = body;

    await updateMatchProperties(record);
    logMessage(`Match ${record.id} with status ${record.status} updated properties`, {
      record,
      old_record,
    });

    if (old_record.status !== record.status) {
      await handleMatchStatusUpdate(record, old_record);
    }
    if (old_record.scheduled_at !== record.scheduled_at) {
      await handleMatchScheduledAtUpdate(record);
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
