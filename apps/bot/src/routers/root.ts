import Router from '@koa/router';
import {
  addChannelListener,
  hasChannelListener,
  removeChannel,
  updateChannelListener,
} from '../discord/channel-manager';
export const rootRouter = new Router();

rootRouter.post('/channels/:channel/listeners', async (ctx) => {
  const { channel } = ctx.params;
  if (hasChannelListener(channel)) {
    await updateChannelListener(channel);
  } else {
    await addChannelListener(channel);
  }
});

rootRouter.delete('/channels/:channel/listeners', async (ctx) => {
  const { channel } = ctx.params;
  if (hasChannelListener(channel)) {
    await removeChannel(channel);
  } else {
    ctx.status = 404;
  }
});
rootRouter.get('/health', (ctx) => {
  ctx.body = 'Ok';
});
