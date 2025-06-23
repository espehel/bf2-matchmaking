import { z } from 'zod';
import {
  matchDraftsInsertSchema,
  matchesInsertSchema,
  matchPlayersInsertSchema,
} from '@bf2-matchmaking/schemas';

export const matchesPostRequestBodySchema = z.object({
  matchValues: matchesInsertSchema,
  matchMaps: z.array(z.number()).nullable(),
  matchTeams: z.array(matchPlayersInsertSchema).nullable(),
  matchDraft: matchDraftsInsertSchema.nullable(),
  servers: z.array(z.string()).nullable(),
});

export type MatchesPostRequestBody = z.infer<typeof matchesPostRequestBodySchema>;
