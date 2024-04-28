import { z } from 'zod';
import { rconSchema, serverSchema } from './schemas';

export type Rcon = z.infer<typeof rconSchema>;
export type Server = z.infer<typeof serverSchema>;
