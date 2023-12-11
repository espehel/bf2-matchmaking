import Router from '@koa/router';
import {
  addChannelListener,
  hasChannelListener,
  removeChannel,
  updateChannelListener,
} from '../discord/channel-manager';
import { getDiscordClient } from '../discord/client';
import { getDemoChannel, isTextBasedChannel } from '../discord/utils';
import { PostDemosRequestBody } from '@bf2-matchmaking/types';
import { error } from '@bf2-matchmaking/logging';
export const rootRouter = new Router();

rootRouter.post('/demos', async (ctx) => {
  const { server, demos } = ctx.request.body as PostDemosRequestBody;
  try {
    const channel = await getDemoChannel();
    const response = await channel.send({
      content: server,
      files: demos,
    });
    ctx.body = {
      channel: response.channel.id,
      message: response.id,
    };
    ctx.status = 201;
  } catch (e) {
    error('POST /demos', e);
    ctx.status = 502;
    ctx.body = e;
  }
});

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
    removeChannel(channel);
  } else {
    ctx.status = 404;
  }
});

rootRouter.post('/messages', async (ctx) => {
  const { messageLink } = ctx.request.body;
  const [, channelId, messageId] = messageLink.split('/').filter(Number);
  try {
    const discordClient = await getDiscordClient();
    const channel = await discordClient.channels.fetch(channelId);

    if (!isTextBasedChannel(channel)) {
      ctx.status = 400;
      ctx.body = 'Message does not belong to a text channel';
      return;
    }
    ctx.body = await channel.messages.fetch(messageId);
  } catch (e) {
    ctx.status = 502;
    ctx.body = e;
  }
});
rootRouter.get('/health', (ctx) => {
  ctx.body = 'Ok';
});
