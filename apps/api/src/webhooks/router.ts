import Router from '@koa/router';
import { info } from '@bf2-matchmaking/logging';
import { handleMatchClosed, handleMatchScheduledAtUpdate } from './match-handler';
import {
  isDiscordConfigsDelete,
  isDiscordConfigsInsert,
  isDiscordConfigsUpdate,
  isMatchesUpdate,
  isMatchServersDelete,
  isMatchServersInsert,
} from './webhook-utils';
import { addMatchServer, removeMatchServer } from '@bf2-matchmaking/redis/matches';
import { MatchStatus } from '@bf2-matchmaking/types';

export const webhooksRouter = new Router({
  prefix: '/webhooks',
});

webhooksRouter.post('/matches', async (ctx) => {
  const { body } = ctx.request;

  if (isMatchesUpdate(body)) {
    const { old_record, record } = body;
    info('webhooks/matches/update', `Match ${record.id} ${record.status}`);

    if (record.status === MatchStatus.Closed || record.status === MatchStatus.Deleted) {
      await handleMatchClosed(record);
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
    info(
      'webhooks/match_servers/insert',
      `Match ${body.record.id} -> ${body.record.server}`
    );
    await addMatchServer(body.record.id, body.record.server);
  } else if (isMatchServersDelete(body)) {
    info(
      'webhooks/match_servers/delete',
      `Match ${body.old_record.id} -> ${body.old_record.server}`
    );
    await removeMatchServer(body.old_record.id, body.old_record.server);
  } else {
    ctx.status = 400;
    ctx.body = { message: 'Invalid payload' };
  }
  ctx.status = 202;
});
