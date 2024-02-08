import { Logtail } from '@logtail/node';
import invariant from 'tiny-invariant';
import {
  LiveServerState,
  MatchesJoined,
  MatchStatus,
  PostgrestError,
  LiveInfo,
  RoundsInsert,
  RoundsRow,
  LogContext,
} from '@bf2-matchmaking/types';
import { error, info } from './winston';

invariant(process.env.LOGTAIL_SOURCE, 'LOGTAIL_SOURCE not defined in environment');
const logger = new Logtail(process.env.LOGTAIL_SOURCE);
export const flush = () => logger.flush();

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
    .catch((e) => error('logtail', e))
    .finally(flush);
};

export const logChangeMatchStatus = (
  status: MatchStatus,
  match: MatchesJoined,
  liveInfo?: LiveInfo | null
) => {
  logger
    .info(`Changing status for Match ${match.id} to ${status}"`, {
      match: JSON.stringify(match),
      liveInfo: JSON.stringify(liveInfo),
    })
    .then((log) => info('logtail', log.message))
    .catch((e) => error('logtail', e))
    .finally(flush);
};

export const logChangeLiveState = (
  prevState: LiveServerState,
  nextState: LiveServerState,
  match: MatchesJoined,
  rounds: Array<RoundsRow>,
  liveInfo: LiveInfo
) => {
  logger
    .info(
      `Live state for Match ${match.id} changed from "${prevState}" to "${nextState}"`,
      {
        match: JSON.stringify(match),
        rounds: JSON.stringify(rounds),
        liveInfo: JSON.stringify(liveInfo),
      }
    )
    .then((log) => info('logtail', log.message))
    .catch((e) => error('logtail', e))
    .finally(flush);
};

export const logAddMatchRound = (
  round: RoundsInsert,
  match: MatchesJoined,
  liveInfo: LiveInfo
) => {
  logger
    .info(`Adding Round ${round.id} to Match ${match.id}`, {
      round: JSON.stringify(round),
      match: JSON.stringify(match),
      liveInfo: JSON.stringify(liveInfo),
    })
    .then((log) => info('logtail', log.message))
    .catch((e) => error('logtail', e))
    .finally(flush);
};

export const logSupabaseError = (message: string, err: PostgrestError) => {
  logger
    .error(message, { ...err })
    .then((log) => error('logtail', log.message))
    .catch((e) => error('logtail', e))
    .finally(flush);
};

export const logErrorMessage = (msg: string, err: unknown, context?: LogContext) => {
  let e: string;
  if (err instanceof Error) {
    e = err.message;
  } else if (typeof err === 'string') {
    e = err;
  } else {
    e = JSON.stringify(err);
  }

  logger
    .error(msg, { error: e, ...context })
    .then((log) => info('logtail', log.message))
    .catch(() => error('logtail', err))
    .finally(flush);
};
export const logMessage = (msg: string, context?: LogContext) => {
  logger
    .info(msg, context)
    .then((log) => info('logtail', log.message))
    .catch((e) => error('logtail', e))
    .finally(flush);
};
