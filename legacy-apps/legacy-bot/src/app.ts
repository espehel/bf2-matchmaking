import 'dotenv/config';
import express, { Request } from 'express';
import { errorHandler, isTextBasedChannel, VerifyDiscordRequest } from './utils';
import invariant from 'tiny-invariant';
import { deleteCommands, installCommands } from './commands';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import {
  ApiError,
  ApiErrorType,
  isDiscordConfig,
  isDiscordMatch,
  MatchConfigsRow,
  PostCommandsReinstallRequestBody,
  PostMatchEventRequestBody,
  WEBHOOK_POSTGRES_CHANGES_TYPE,
  WebhookPostgresChangesPayload,
} from '@bf2-matchmaking/types';
import { error, info } from '@bf2-matchmaking/logging';
import { handleMatchDraft, handleMatchSummon } from './match-events';
import {
  addChannelListener,
  initChannelListener,
  updateChannelListener,
} from './listeners/channel-listener';
import { removeChannel } from './listeners/member-listener';
import { api, verify } from '@bf2-matchmaking/utils';
import interactionRouter from './interactions/interaction-router';
import { getDiscordClient } from './client';
import {
  createDraftingMatchFromPubobotEmbed,
  getTopLocationPollResult,
  startMatchFromPubobotEmbed,
} from './match-tracking-service';
import { initScheduledEventsListener } from './listeners/scheduled-events-listener';
import { loadServerLocations } from './services/locations';

const app = express();
const PORT = process.env.PORT || 5001;

invariant(process.env.PUBLIC_KEY, 'PUBLIC_KEY not defined');
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

(async function () {
  try {
    await getDiscordClient();
    info('app init', 'Discord client initialization complete.');
    //await initChannelListener();
    info('app init', 'Channel listener initialization complete.');
    //await initScheduledEventsListener();
    info('app init', 'Scheduled events listener initialization complete.');
    loadServerLocations();
  } catch (err) {
    error('app init', err);
  }
})();

app.post(
  api.bot().paths.matchEvent,
  async (req: Request<{}, {}, PostMatchEventRequestBody>, res, next) => {
    try {
      const { event, matchId } = req.body;
      info('/api/match_events', `Received event ${event} for match ${matchId}`);
      const match = await client().getMatch(matchId).then(verifySingleResult);
      if (!isDiscordMatch(match)) {
        throw new ApiError(ApiErrorType.NoMatchDiscordChannel);
      }

      if (event === 'Summon') {
        await handleMatchSummon(match);
      }
      if (event === 'Draft') {
        await handleMatchDraft(match);
      }
      res.end();
    } catch (e) {
      error('match_events', e);
      res.status(500).send(JSON.stringify(e));
    }
  }
);

app.post(
  api.bot().paths.matchConfigEvent,
  async (req: Request<{}, {}, WebhookPostgresChangesPayload<MatchConfigsRow>>, res) => {
    info('POST /match_configs', `Request body: ${JSON.stringify(req.body)}`);
    try {
      switch (req.body.type) {
        case WEBHOOK_POSTGRES_CHANGES_TYPE.INSERT: {
          if (isDiscordConfig(req.body.record)) {
            await addChannelListener(req.body.record.channel);
          }
          break;
        }
        case WEBHOOK_POSTGRES_CHANGES_TYPE.UPDATE: {
          if (isDiscordConfig(req.body.record)) {
            await updateChannelListener(req.body.record.channel);
          }
          break;
        }
        case WEBHOOK_POSTGRES_CHANGES_TYPE.DELETE: {
          if (isDiscordConfig(req.body.old_record)) {
            await removeChannel(req.body.old_record.channel);
          }
          break;
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        error('POST /match_configs', e.message);
      } else if (typeof e === 'string') {
        error('POST /match_configs', e);
      } else {
        error('POST /match_configs', JSON.stringify(e));
      }
    } finally {
      res.send();
    }
  }
);

app.post('/matches', async (req, res) => {
  const { channelId, messageId, configId, serverIp } = req.body;

  const discordClient = await getDiscordClient();
  const channel = await discordClient.channels.fetch(channelId);

  if (!isTextBasedChannel(channel)) {
    return res.send('Message does not belong to a text channel').sendStatus(400);
  }
  const message = await channel.messages.fetch(messageId);

  try {
    const match = await createDraftingMatchFromPubobotEmbed(
      message.embeds[0],
      discordClient.users,
      configId
    );
    await client().updateMatch(match.id, { server: serverIp });
    await api.rcon().postMatchLive(match.id, false).then(verify);
    return res.send(match);
  } catch (e) {
    return res.status(502).send(e);
  }
});

app.post(
  '/commands/reinstall',
  async (req: Request<{}, {}, PostCommandsReinstallRequestBody>, res) => {
    const { guilds, commands } = req.body;
    invariant(process.env.APP_ID, 'APP_ID not defined');
    const appId = process.env.APP_ID;
    await Promise.all(guilds.map((guildId) => deleteCommands(appId, guildId)));
    await Promise.all(guilds.map((guildId) => installCommands(appId, guildId, commands)));
    await deleteCommands(appId, null);
    await installCommands(appId, null, commands);
    res.sendStatus(200);
  }
);

app.get('/messages', async (req, res) => {
  const { messageLink } = req.body;
  const [, channelId, messageId] = messageLink.split('/').filter(Number);
  try {
    const discordClient = await getDiscordClient();
    const channel = await discordClient.channels.fetch(channelId);

    if (!isTextBasedChannel(channel)) {
      return res.send('Message does not belong to a text channel').sendStatus(400);
    }
    const message = await channel.messages.fetch(messageId);
    const location = await getTopLocationPollResult(message);
    /*const response = await channel.send({
      files: ['http://flz.4e.fi/demos/auto_2023_11_05_19_24_12.bf2demo'],
    });*/
    res.status(200).send(location);
  } catch (e) {
    return res.status(502).send(e);
  }
});

app.get('/events', async (req, res) => {
  const { guildId } = req.body;
  try {
    const discordClient = await getDiscordClient();
    discordClient.on('guildScheduledEventCreated', async (event) => {});
    const guild = await discordClient.guilds.fetch(guildId);

    const events = await guild.scheduledEvents.fetch();

    return res.status(200).send(events);
  } catch (e) {
    return res.status(502).send(e);
  }
});

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.use('/interactions', interactionRouter);
app.get('/health', (req, res) => {
  res.status(200).send('Ok');
});

app.use(errorHandler);

app.listen(PORT, () => {
  info('app init', `Server listening on port ${PORT}`);
});
