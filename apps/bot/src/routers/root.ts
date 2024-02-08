import Router from '@koa/router';
import {
  addChannelListener,
  hasChannelListener,
  removeChannel,
  updateChannelListener,
} from '../discord/channel-manager';
import { getDiscordClient } from '../discord/client';
import { isTextBasedChannel } from '../discord/utils';
import { PostDemosRequestBody } from '@bf2-matchmaking/types';
import { error } from '@bf2-matchmaking/logging';
import { getDemoChannel } from '../services/message-service';
export const rootRouter = new Router();

rootRouter.post('/demos', async (ctx) => {
  const { server, demos } = ctx.request.body as PostDemosRequestBody;
  try {
    const channel = await getDemoChannel();

    const batchSize = 10;
    const demoBatches = [];
    for (let i = 0; i < demos.length; i += batchSize) {
      const batch = demos.slice(i, Math.min(demos.length, i + batchSize));
      demoBatches.push(batch);
    }

    const responses = await Promise.all(
      demoBatches.map((demoBatch) =>
        channel.send({
          content: server,
          files: demoBatch,
        })
      )
    );
    ctx.body = {
      channel: channel.id,
      messages: responses.map((response) => response.id).join(', '),
    };
    ctx.status = 201;
  } catch (e) {
    error('POST /demos', e);
    ctx.status = 502;
    ctx.body = { message: 'Failed to save demos in discord', demos: demos };
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
    const message = await channel.messages.fetch(messageId);
    ctx.body = message;
  } catch (e) {
    ctx.status = 502;
    ctx.body = e;
  }
});
rootRouter.get('/health', (ctx) => {
  ctx.body = 'Ok';
});
