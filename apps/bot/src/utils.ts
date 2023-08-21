import {
  APIApplicationCommandInteractionDataOption,
  APIInteractionDataOptionBase,
  ApplicationCommandOptionType,
} from 'discord-api-types/v10';
import { verifyKey } from 'discord-interactions';
import { ErrorRequestHandler, Request } from 'express';
import {
  ApiError,
  MatchesJoined,
  MatchPlayersInsert,
  PlayersRow,
} from '@bf2-matchmaking/types';
import { Channel, Embed, Message, MessageReaction, TextChannel } from 'discord.js';
import { getMatchIdFromEmbed, isSummonEmbed } from '@bf2-matchmaking/discord';
import { api } from '@bf2-matchmaking/utils';

export const getOption = (
  key: string,
  options: APIApplicationCommandInteractionDataOption[] = []
) => {
  const option = options.find((option) => option.name === key) as
    | APIInteractionDataOptionBase<ApplicationCommandOptionType.Channel, string>
    | undefined;
  return option?.value;
};

const WHITELIST = Object.values(api.bot().paths).concat(['/health']);
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

export const getMatchCopyWithPlayer =
  (player: PlayersRow) =>
  (match: MatchesJoined): MatchesJoined => ({
    ...match,
    players: [...match.players, player],
    teams: [
      ...match.teams,
      {
        match_id: match.id,
        player_id: player.id,
        team: null,
        expire_at: '',
        ready: false,
        source: '',
        captain: false,
        updated_at: new Date().toISOString(),
      },
    ],
  });

export const getMatchCopyWithoutPlayer =
  (playerId: string) =>
  (match: MatchesJoined): MatchesJoined => ({
    ...match,
    players: match.players.filter((player) => player.id !== playerId),
    teams: match.teams.filter((player) => player.player_id !== playerId),
  });

export const isTextBasedChannel = (channel: Channel | null): channel is TextChannel =>
  Boolean(channel && channel.isTextBased());

export const isPubobotMatchStarted = (embed?: Embed) =>
  embed?.title?.includes('has started!') || false;

export const compareMessageReactionCount = (
  firstValue: MessageReaction,
  secondValue: MessageReaction
) => secondValue.count - firstValue.count;

export const toMatchPlayer =
  (matchId: number, team: 'a' | 'b') =>
  (player: PlayersRow): MatchPlayersInsert => ({
    match_id: matchId,
    player_id: player.id,
    team,
  });
