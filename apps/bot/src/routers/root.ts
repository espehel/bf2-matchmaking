import Router from '@koa/router';
import {
  addChannelListener,
  hasChannelListener,
  removeChannel,
  updateChannelListener,
} from '../discord/channel-manager';
import { getDiscordClient } from '../discord/client';
import { getDemoChannel, isTextBasedChannel } from '../discord/utils';
import { client } from '@bf2-matchmaking/supabase';
import { PostDemosRequestBody } from '@bf2-matchmaking/types';
export const rootRouter = new Router();

rootRouter.post('/demos', async (ctx) => {
  const { server, demos } = ctx.request.body as PostDemosRequestBody;
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
    await removeChannel(channel);
  } else {
    ctx.status = 404;
  }
});

rootRouter.post('/messages', async (ctx) => {
  const { messageLink } = ctx.request.body;
  const [guildId, channelId, messageId] = messageLink.split('/').filter(Number);
  try {
    const discordClient = await getDiscordClient();
    const channel = await discordClient.channels.fetch(channelId);

    if (!isTextBasedChannel(channel)) {
      ctx.status = 400;
      ctx.body = 'Message does not belong to a text channel';
      return;
    }
    const message = await channel.messages.fetch(messageId);
    //const match = await client().getMatch(802).then(verifySingleResult);
    //const location = await startTopLocationPoll(match, message);
    /*const response = await channel.send({
      files: ['http://flz.4e.fi/demos/auto_2023_11_05_19_24_12.bf2demo'],
    });*/
    ctx.body = message;
  } catch (e) {
    ctx.status = 502;
    ctx.body = e;
  }
});
rootRouter.get('/health', (ctx) => {
  ctx.body = 'Ok';
});
