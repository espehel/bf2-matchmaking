import Router from '@koa/router';
import { Context } from 'koa';
import { GatherEventStream } from './GatherEventStream';
import { stream } from '@bf2-matchmaking/redis/stream';
import { isString } from '@bf2-matchmaking/types';
import { waitForEvent } from './event-stream';
import { error } from '@bf2-matchmaking/logging';

export const gathersRouter = new Router({
  prefix: '/gathers',
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
      sseStream.destroy(err);
    }
  );

  const interval = setInterval(() => {
    sseStream.writeHeartbeat();
  }, 10000);

  sseStream.on('close', async () => {
    clearInterval(interval);
    closeStream();
  });
  sseStream.on('error', (err) => {
    error('GET /:config/events/stream', err);
  });

  ctx.status = 200;
  ctx.body = sseStream;
  sseStream.writeHeartbeat();
});
