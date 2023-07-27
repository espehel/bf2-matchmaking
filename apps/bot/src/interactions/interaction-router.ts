import express from 'express';
import {
  APIInteraction,
  ApplicationCommandType,
  InteractionType,
} from 'discord-api-types/v10';
import { InteractionResponseType } from 'discord-interactions';
import { getOption } from '../utils';
import { ApplicationCommandName } from '../commands';
import { logInternalApiError, logSupabaseError } from '@bf2-matchmaking/logging';
import { rcon } from '@bf2-matchmaking/utils/src/internal-api';
import { updatePlayerKeyHash } from './interaction-service';
import { getServerInfoList } from '../server-interactions';

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
    !(
      type === InteractionType.ApplicationCommand &&
      data.type === ApplicationCommandType.ChatInput
    )
  ) {
    return res.end();
  }

  const { name, options } = data;
  if (name === ApplicationCommandName.Register && member) {
    const keyhash = getOption('key', options);
    const serverIp = getOption('serverip', options);
    const playerId = getOption('playerid', options);
    let updateError;

    if (keyhash) {
      const { error } = await updatePlayerKeyHash(member, keyhash);
      updateError = error;
    } else if (serverIp && playerId) {
      const { data: player, error: apiError } = await rcon().getRconServerPlayer(
        serverIp,
        playerId
      );
      if (!player) {
        logInternalApiError('Failed to fetch Server Player', apiError);
        return res.send(
          reply('Something went wrong while trying to update your keyhash')
        );
      }
      const { error } = await updatePlayerKeyHash(member, player.keyhash);
      updateError = error;
    } else {
      return res.send(
        reply(
          'Either you have to give a keyhash directly, or connect to a server and give serverIp and playerId'
        )
      );
    }

    if (updateError) {
      logSupabaseError('Failed to update player keyhash', updateError);
      return res.send(reply('Something went wrong while trying to update your keyhash'));
    }
    return res.send(reply('Keyhash successfully updated.'));
  }

  if (name === ApplicationCommandName.Servers) {
    const serverInfo = await getServerInfoList();
    return res.send(
      reply(typeof serverInfo === 'string' ? serverInfo : serverInfo.join('\n'))
    );
  }
});

const reply = (content: string) => ({
  type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
  data: {
    content,
  },
});

export default router;
