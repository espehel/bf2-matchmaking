import Router from '@koa/router';
import { Context } from 'koa';
import { GatherEventStream } from './GatherEventStream';
import { stream } from '@bf2-matchmaking/redis/stream';
import { isString } from '@bf2-matchmaking/types';

export const gathersRouter = new Router({
  prefix: '/gathers',
});

gathersRouter.get('/:config/events', async (ctx: Context) => {
  ctx.body = await stream(`gather:${ctx.params.config}:events`).readEvents();
});

gathersRouter.get('/:config/events/stream', (ctx) => {
  ctx.request.socket.setTimeout(0);
  ctx.req.socket.setNoDelay(true);
  ctx.req.socket.setKeepAlive(true);

  ctx.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const sseStream = new GatherEventStream();

  ctx.status = 200;
  ctx.body = sseStream;

  async function waitForEvent(lastEvent: string) {
    const events = await stream(`gather:${ctx.params.config}:events`).readEventsBlocking(
      lastEvent
    );
    let lastId = lastEvent;
    for (const event of events) {
      sseStream.writeEvent(event);
      lastId = event.id;
    }
    if (sseStream.closed) {
      return;
    }
    setImmediate(() => waitForEvent(lastId));
  }
  waitForEvent(isString(ctx.query.start) ? ctx.query.start : '$').catch((err) => {
    sseStream.destroy(err);
  });

  const interval = setInterval(() => {
    sseStream.writeHeartbeat();
  }, 10000);

  sseStream.on('close', async () => {
    clearInterval(interval);
  });
});
