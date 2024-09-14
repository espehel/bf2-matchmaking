import { z } from 'zod';

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
  roundsPlayed: z.number(),
  pendingSince: z.string().datetime({ offset: true }).optional(),
});

export const serverInfoSchema = z.object({
  port: z.string(),
  name: z.string(),
  joinmeHref: z.string().url(),
  joinmeDirect: z.string().url(),
  country: z.string(),
  city: z.string(),
  noVehicles: z.boolean().nullable(),
  demos_path: z.string().nullable(),
});
export const serverSchema = z
  .object({
    status: z.string(),
    matchId: z.string(),
    liveAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    errorAt: z.string().datetime({ offset: true }),
  })
  .partial();

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);
