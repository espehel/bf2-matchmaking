import express from 'express';
import {
  APIInteraction,
  ApplicationCommandType,
  InteractionType,
} from 'discord-api-types/v10';
import { InteractionResponseType } from 'discord-interactions';
import { getOption } from '../utils';
import { ApplicationCommandName } from '../commands';
import { client } from '@bf2-matchmaking/supabase';
import { logPlayerUpdated, logSupabaseError } from '@bf2-matchmaking/logging';

const router = express.Router();

router.post('/', async (req, res) => {
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
      if (name === ApplicationCommandName.Register) {
        const keyhash = getOption('key', options);
        if (keyhash && member) {
          const player = await client().services.getOrCreatePlayer(member.user);
          const { data, error } = await client().updatePlayer(player.id, { keyhash });
          if (data) {
            logPlayerUpdated('Player keyhash updated', data, { keyhash });
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: 'Keyhash updated',
              },
            });
          }
          if (error) {
            logSupabaseError('Failed to updated keyhash', error);
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: 'Failed to updated keyhash',
              },
            });
          }
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

export default router;
