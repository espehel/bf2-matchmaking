import {
  APIApplicationCommandInteractionDataOption,
  APIInteractionDataOptionBase,
  ApplicationCommandOptionType,
} from 'discord-api-types/v10';
import { verifyKey } from 'discord-interactions';
import { ErrorRequestHandler, Request } from 'express';
import { ApiError } from '@bf2-matchmaking/types';
import { Message } from 'discord.js';
import { getMatchIdFromEmbed, isSummonEmbed } from '@bf2-matchmaking/discord';

export const getOption = (
  key: string,
  options: APIApplicationCommandInteractionDataOption[] = []
) => {
  const option = options.find((option) => option.name === key) as
    | APIInteractionDataOptionBase<ApplicationCommandOptionType.Channel, string>
    | undefined;
  return option?.value;
};

const WHITELIST = ['/api/match_events', '/health'];
export const VerifyDiscordRequest = (clientKey: string) => {
  return function (req: Request, res: any, buf: any, encoding: any) {
    if (WHITELIST.includes(req.url)) {
      return;
    }
    const signature = req.get('X-Signature-Ed25519') || '';
    const timestamp = req.get('X-Signature-Timestamp') || '';

    const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
    if (!isValidRequest) {
      res.status(401).send('Bad request signature');
      throw new Error('Bad request signature');
    }
  };
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.status).send(err.message);
  } else if (err instanceof Error) {
    res.status(500).send(err.message);
  } else {
    res.status(500).send(err);
  }
};

export const toMatchPlayerId = (memberId: string) => ({ player_id: memberId });

export const hasSummonEmbed = (message: Message) => message.embeds.some(isSummonEmbed);
export const findMatchId = (message: Message) =>
  message.embeds
    .filter(isSummonEmbed)
    .map(getMatchIdFromEmbed)
    .find((matchId) => Boolean(matchId));
