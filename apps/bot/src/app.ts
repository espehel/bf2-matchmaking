import 'dotenv/config';
import express, { Request } from 'express';
import { errorHandler, VerifyDiscordRequest } from './utils';
import invariant from 'tiny-invariant';
import { deleteCommands, installCommands } from './commands';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import {
  ApiError,
  ApiErrorType,
  isDiscordMatch,
  MatchConfigEvent,
  PostCommandsReinstallRequestBody,
  PostMatchConfigEventRequestBody,
  PostMatchEventRequestBody,
} from '@bf2-matchmaking/types';
import { error, info } from '@bf2-matchmaking/logging';
import { handleMatchDraft, handleMatchSummon } from './match-events';
import {
  addChannelListener,
  initChannelListener,
  updateChannelListener,
} from './listeners/channel-listener';
import { removeChannel } from './listeners/member-listener';
import { api } from '@bf2-matchmaking/utils';
import interactionRouter from './interactions/interaction-router';

// Create an express app
const app = express();
// Get port, or default to 5001
const PORT = process.env.PORT || 5001;
// Parse request body and verifies incoming requests using discord-interactions package
invariant(process.env.PUBLIC_KEY, 'PUBLIC_KEY not defined');
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

(function () {
  initChannelListener()
    .then(() => info('app init', 'Channel listener initialization complete.'))
    .catch((err) => error('app init', err));
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
      next(e);
    }
  }
);

app.post(
  api.bot().paths.matchConfigEvent,
  async (req: Request<{}, {}, PostMatchConfigEventRequestBody>, res, next) => {
    try {
      const { event, channelId } = req.body;
      info(
        '/api/match_config_events',
        `Received event ${event} for channel ${channelId}`
      );

      if (event === MatchConfigEvent.INSERT) {
        await addChannelListener(channelId);
      }
      if (event === MatchConfigEvent.UPDATE) {
        await updateChannelListener(channelId);
      }
      if (event === MatchConfigEvent.DELETE) {
        await removeChannel(channelId);
      }
      res.end();
    } catch (e) {
      error('match_events', e);
      next(e);
    }
  }
);

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

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.use('/interactions', interactionRouter);
app.get('/health', (req, res) => {
  res.status(200).send('Ok');
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
