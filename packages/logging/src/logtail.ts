import { Logtail } from '@logtail/node';
import invariant from 'tiny-invariant';
import {
  MatchConfigsRow,
  MatchesJoined,
  MatchesRow,
  MatchPlayersRow,
  MatchStatus,
  PlayerListItem,
  PlayersRow,
  PlayersUpdate,
  PostgrestError,
  RoundsInsert,
  ServerInfo,
} from '@bf2-matchmaking/types';
import { error, info } from './winston';

invariant(process.env.LOGTAIL_SOURCE, 'LOGTAIL_SOURCE not defined in environment');
const logger = new Logtail(process.env.LOGTAIL_SOURCE);
export const logMatchEvent = (
  event: 'summon' | 'draft' | 'reopen' | 'next',
  match: MatchesRow
) => {
  logger
    .info(`Match ${match.id} received event ${event}`, {
      matchId: match.id,
      status: match.status,
      match: JSON.stringify(match),
    })
    .catch((e) => error('logtail', e));
};

export const logMatchPlayerEvent = (
  event: 'join' | 'leave' | 'ready' | 'pick',
  mp: Partial<MatchPlayersRow>
) => {
  logger
    .info(`Match ${mp.match_id} received event ${event} for player ${mp.player_id}`, {
      matchId: mp.match_id || 'no value',
      playerId: mp.match_id || 'no value',
      matchPlayer: JSON.stringify(mp),
    })
    .catch((e) => error('logtail', e));
};

export const logCommandEvent = (
  command: string,
  message: string,
  author: string,
  config: MatchConfigsRow
) => {
  logger
    .info(`Channel ${config.name} received command ${command}`, {
      command,
      message,
      config: JSON.stringify(config),
    })
    .catch((e) => error('logtail', e));
};

export const logCreateChannelMessage = (
  channelId: string,
  messageId: string = 'no message id',
  content: string | null = 'no content',
  embed?: unknown
) => {
  logger
    .info(`Channel ${channelId} received message ${content}`, {
      content,
      messageId,
      embed: JSON.stringify(embed),
    })
    .catch((e) => error('logtail', e));
};

export const logEditChannelMessage = (
  channelId: string,
  messageId: string = 'no message id',
  content: string | null = 'no content',
  embed?: unknown
) => {
  logger
    .info(`Channel ${channelId} edited message ${content}`, {
      content,
      messageId,
      embed: JSON.stringify(embed),
    })
    .catch((e) => error('logtail', e));
};

export const logOngoingMatchCreated = (match: MatchesJoined) =>
  logger
    .info(`Created ongoing Match ${match.id}`, {
      match: JSON.stringify(match),
    })
    .then((log) => info('logtail', log.message))
    .catch((e) => error('logtail', e));

export const logChangeMatchStatus = (
  status: MatchStatus,
  reason: string,
  match: MatchesJoined,
  si: ServerInfo | null,
  pl: Array<PlayerListItem> | null
) =>
  logger
    .info(`Changing status for Match ${match.id} to ${status} because "${reason}"`, {
      match: JSON.stringify(match),
      si: JSON.stringify(si),
      pl: JSON.stringify(pl),
    })
    .then((log) => info('logtail', log.message))
    .catch((e) => error('logtail', e));

export const logAddMatchRound = (
  round: RoundsInsert,
  match: MatchesJoined,
  si: ServerInfo | null,
  pl: Array<PlayerListItem> | null
) =>
  logger
    .info(`Adding round to Match ${match.id}`, {
      round: JSON.stringify(round),
      match: JSON.stringify(match),
      si: JSON.stringify(si),
      pl: JSON.stringify(pl),
    })
    .then((log) => info('logtail', log.message))
    .catch((e) => error('logtail', e));

export const logSupabaseError = (message: string, err: PostgrestError) =>
  logger
    .error(message, { ...err })
    .then((log) => error('logtail', log.message))
    .catch((e) => error('logtail', e));

export const logPlayerUpdated = (
  message: string,
  player: PlayersRow,
  values: PlayersUpdate
) =>
  logger
    .info(`Updated player ${player.id}`, {
      player: JSON.stringify(player),
      ...values,
    })
    .then((log) => info('logtail', log.message))
    .catch((e) => error('logtail', e));
