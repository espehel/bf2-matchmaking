import { Node as Logtail } from '@logtail/js';
import {
  LiveServerState,
  MatchesJoined,
  PostgrestError,
  LiveInfo,
  RoundsInsert,
  LogContext,
} from '@bf2-matchmaking/types';
import { error, info, warn } from './winston';
import { assertString } from '@bf2-matchmaking/utils';

assertString(process.env.LOGTAIL_SOURCE, 'LOGTAIL_SOURCE not defined in environment');
assertString(process.env.LOGTAIL_HOST, 'LOGTAIL_HOST not defined in environment');
const logger = new Logtail(process.env.LOGTAIL_SOURCE, {
  contextObjectCircularRefWarn: false,
  endpoint: `https://${process.env.LOGTAIL_HOST}`,
});
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

export const logChangeLiveState = (
  matchId: string | number,
  prevState: LiveServerState,
  nextState: LiveServerState,
  liveInfo: LiveInfo
) => {
  logger
    .info(`Match ${matchId}: Live state changed from "${prevState}" to "${nextState}"`, {
      liveInfo: JSON.stringify(liveInfo),
    })
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
    .then((log) => info('logtail', `${log.message}: ${e}`))
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

export const logWarnMessage = (msg: string, context?: LogContext) => {
  logger
    .warn(msg, context)
    .then((log) => warn('logtail', log.message))
    .catch((e) => error('logtail', e))
    .finally(flush);
};
