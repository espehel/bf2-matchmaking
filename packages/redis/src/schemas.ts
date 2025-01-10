import { z } from 'zod';
import { ServerStatus } from '@bf2-matchmaking/types/server';

export const matchSchema = z.object({
  state: z.enum([
    'pending',
    'warmup',
    'prelive',
    'live',
    'endlive',
    'finished',
    'stale',
  ] as const),
  roundsPlayed: z.string(),
  pendingSince: z.string().datetime({ offset: true }).optional(),
});

export const serverDataSchema = z.object({
  port: z.string(),
  name: z.string(),
  joinmeHref: z.string().url(),
  joinmeDirect: z.string().url(),
  country: z.string(),
  city: z.string(),
  noVehicles: z.boolean(),
  demos_path: z.string(),
});
export const serverSchema = z.object({
  status: z.nativeEnum(ServerStatus),
  matchId: z.number().optional(),
  liveAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional(),
  errorAt: z.string().datetime({ offset: true }).optional(),
});

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);
