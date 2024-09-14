import { z } from 'zod';
import { matchSchema, serverInfoSchema, serverSchema } from './schemas';

export type Server = z.infer<typeof serverSchema>;
export type ServerInfo = z.infer<typeof serverInfoSchema>;
export type Match = z.infer<typeof matchSchema>;
