import { z } from 'zod';
import { matchSchema, serverDataSchema, serverSchema } from './schemas';

export type Server = z.infer<typeof serverSchema>;
export type ServerData = z.infer<typeof serverDataSchema>;
export type Match = z.infer<typeof matchSchema>;
