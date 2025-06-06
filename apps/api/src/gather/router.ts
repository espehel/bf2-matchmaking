import Router from '@koa/router';
import { Context } from 'koa';
import { GatherEventStream } from './GatherEventStream';
import { stream } from '@bf2-matchmaking/redis/stream';
import { isString } from '@bf2-matchmaking/types';
import { waitForEvent } from './event-stream';
import { error, info } from '@bf2-matchmaking/logging';
import {
  getGatherPlayers,
  getGatherQueue,
  getGatherState,
} from '@bf2-matchmaking/redis/gather';
import { hash } from '@bf2-matchmaking/redis/hash';

export const gathersRouter = new Router({
  prefix: '/gathers',
});

gathersRouter.get('/:config', async (ctx: Context) => {
  const state = await getGatherState(ctx.params.config);
  const queue = await getGatherQueue(ctx.params.config);
  const players = await getGatherPlayers(queue);
  const events = await stream(`gather:${ctx.params.config}:events`).readEvents(true);
  ctx.body = { state, players, events };
});

gathersRouter.post('/:config/address', async (ctx: Context) => {
  const state = await getGatherState(ctx.params.config);
  if (state.status !== 'Queueing') {
    ctx.throw(400, 'Gather is not in queueing state');
  }
  ctx.body = await hash(`gather:${ctx.params.config}`).set({
    address: ctx.request.body.address,
  });
});

gathersRouter.get('/:config/events', async (ctx: Context) => {
  ctx.body = await stream(`gather:${ctx.params.config}:events`).readEvents(true);
});

gathersRouter.get('/:config/events/stream', (ctx) => {
  ctx.request.socket.setTimeout(0);
  ctx.req.socket.setNoDelay(true);
  ctx.req.socket.setKeepAlive(true);

  ctx.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const sseStream = new GatherEventStream();

  const closeStream = waitForEvent(
    ctx.params.config,
    isString(ctx.query.start) ? ctx.query.start : '$',
    (event) => {
      sseStream.writeEvent(event);
    },
    (err) => {
      info(`GET /${ctx.params.config}/events/stream`, 'Event error');
      sseStream.destroy(err);
    }
  );

  const interval = setInterval(() => {
    sseStream.writeHeartbeat();
  }, 10000);

  sseStream.on('close', async () => {
    info(`GET /${ctx.params.config}/events/stream`, 'Stream close');
    clearInterval(interval);
    closeStream();
  });
  sseStream.on('error', (err) => {
    error(`GET /${ctx.params.config}/events/stream`, err);
  });
  sseStream.on('finish', () => {
    info(`GET /${ctx.params.config}/events/stream`, 'Stream finish');
  });

  ctx.status = 200;
  ctx.body = sseStream;
  sseStream.writeHeartbeat();
});
