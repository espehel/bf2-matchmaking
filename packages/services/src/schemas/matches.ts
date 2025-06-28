import { z, array, object, string, number } from 'zod';
import {
  matchDraftsInsertSchema,
  matchesInsertSchema,
  matchPlayersInsertSchema,
} from '@bf2-matchmaking/schemas';

export const matchesPostRequestBodySchema = object({
  matchValues: matchesInsertSchema,
  matchMaps: array(number()).nullable(),
  matchTeams: array(matchPlayersInsertSchema).nullable(),
  matchDraft: matchDraftsInsertSchema.nullable(),
  servers: array(string()).nullable(),
});

export type MatchesPostRequestBody = z.infer<typeof matchesPostRequestBodySchema>;

export const matchLogEntrySchema = object({
  message: string(),
  timestamp: string(),
  level: z.enum(['info', 'warn', 'error']),
});
export type MatchLogEntry = z.infer<typeof matchLogEntrySchema>;

export const getMatchLogsResponseSchema = array(matchLogEntrySchema);
export type GetMatchLogsResponse = z.infer<typeof getMatchLogsResponseSchema>;
