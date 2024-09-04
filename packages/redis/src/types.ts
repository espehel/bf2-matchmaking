import { z } from 'zod';
import {
  matchSchema,
  rconSchema,
  serverInfoSchema,
  serverLiveSchema,
  serverSchema,
} from './schemas';

export type Rcon = z.infer<typeof rconSchema>;
export type Server = z.infer<typeof serverSchema>;
export type ServerLive = z.infer<typeof serverLiveSchema>;
export type ServerInfo = z.infer<typeof serverInfoSchema>;
export type Match = z.infer<typeof matchSchema>;

interface RedisSuccessResponse<T> {
  success: true;
  data: T;
  error?: never;
}

export interface RedisErrorResponse {
  success: false;
  error: string;
  data?: never;
}

export type RedisResult<T> = RedisSuccessResponse<T> | RedisErrorResponse;
