import { z } from 'zod';
import { rconSchema, serverInfoSchema, serverLiveSchema, serverSchema } from './schemas';

export type Rcon = z.infer<typeof rconSchema>;
export type Server = z.infer<typeof serverSchema>;
export type ServerLive = z.infer<typeof serverLiveSchema>;
export type ServerInfo = z.infer<typeof serverInfoSchema>;
