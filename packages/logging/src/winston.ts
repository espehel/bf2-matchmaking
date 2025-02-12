import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize } = format;

const DEV_FORMAT = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${level.toLocaleUpperCase()}] [${label}] ${message}`;
});
const PROD_FORMAT = printf(({ level, message, label }) => {
  return `[${level.toLocaleUpperCase()}] [${label}] ${message}`;
});
const TRANSPORTS = [new transports.Console()];

const logger =
  process.env.NODE_ENV === 'development'
    ? createLogger({
        format: combine(timestamp(), DEV_FORMAT, colorize()),
        transports: TRANSPORTS,
        level: process.env.npm_config_level || 'info',
      })
    : createLogger({
        format: combine(PROD_FORMAT, colorize()),
        transports: TRANSPORTS,
      });
export const error = (label: string, error: unknown) => {
  if (error instanceof Error) {
    logger.log({ level: 'error', label, message: error.message });
  } else if (typeof error === 'string') {
    logger.log({ level: 'error', label, message: error });
  } else {
    logger.log({ level: 'error', label, message: JSON.stringify(error) });
  }
};
export const warn = (label: string, message: string) =>
  logger.log({ level: 'warn', label, message });
export const info = (label: string, message: string) =>
  logger.log({ level: 'info', label, message });
export const verbose = (label: string, message: string) =>
  logger.log({ level: 'verbose', label, message });
