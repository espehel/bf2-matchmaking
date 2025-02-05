import { GatherStatus } from '@bf2-matchmaking/types/gather';
import { z } from 'zod';

export const GatherStateSchema = z.object({
  status: z.nativeEnum(GatherStatus),
  address: z.string(),
  matchId: z.string().optional(),
  summoningAt: z.string().optional(),
});
