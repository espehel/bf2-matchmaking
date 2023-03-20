import 'dotenv/config';
import express, { Request } from 'express';
import { InteractionResponseType } from 'discord-interactions';
import { errorHandler, getOption, VerifyDiscordRequest } from './utils';
import invariant from 'tiny-invariant';
import {
  HasGuildCommands,
  INFO_COMMAND,
  JOIN_COMMAND,
  LEAVE_COMMAND,
  PICK_COMMAND,
} from './commands';
import {
  APIInteraction,
  ApplicationCommandType,
  InteractionType,
} from 'discord-api-types/v10';
import {
  addPlayer,
  getMatchInfoByChannel,
  pickMatchPlayer,
  removePlayer,
} from './match-interactions';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import {
  ApiError,
  ApiErrorType,
  isDiscordMatch,
  MatchConfigEvent,
  PostMatchConfigEventRequestBody,
  PostMatchEventRequestBody,
} from '@bf2-matchmaking/types';
import { error, info } from '@bf2-matchmaking/logging';
import { handleMatchDraft, handleMatchSummon } from './match-events';
import {
  addChannelListener,
  initChannelListener,
  updateChannelListener,
} from './channel-listener';
import { removeChannel } from './member-listener';

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
  '/api/match_events',
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
  '/api/match_config_events',
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

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async (req, res) => {
  // Interaction type and data
  const { type, id, data, member, channel_id } = req.body as APIInteraction;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.Ping) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (
    type === InteractionType.ApplicationCommand &&
    data.type === ApplicationCommandType.ChatInput
  ) {
    try {
      const { name, options } = data;
      if (name === 'join') {
        invariant(member, 'Could not get user data from request.');
        // await addPlayer(channel_id, member.user, null);
      }
      if (name === 'leave') {
        invariant(member, 'Could not get user data from request.');
        await removePlayer(channel_id, member.user);
      }
      if (name === 'info') {
        const info = await getMatchInfoByChannel(channel_id);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [info],
          },
        });
      }
      if (name === 'pick') {
        const pickedPlayer = getOption('player', options);
        invariant(member, 'Could not get user data from request.');
        if (!pickedPlayer) {
          return 'No player mentioned';
        }
        const message = await pickMatchPlayer(channel_id, member.user.id, pickedPlayer);

        if (message) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: pickedPlayer,
            },
          });
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: e.message,
          },
        });
      } else {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: JSON.stringify(e),
          },
        });
      }
    }
  }
  res.end();
});

app.get('/health', (req, res) => {
  res.status(200).send('Ok');
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
  // Check if guild commands from commands.js are installed (if not, install them)
  invariant(process.env.APP_ID, 'APP_ID not defined');
  invariant(process.env.GUILD_ID, 'GUILD_ID not defined');
  HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    JOIN_COMMAND,
    LEAVE_COMMAND,
    INFO_COMMAND,
    PICK_COMMAND,
  ]);
});
