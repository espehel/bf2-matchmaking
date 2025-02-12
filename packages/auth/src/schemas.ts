import { z } from 'zod';

export const JWTUserSchema = z.object({
  id: z.string(),
  nick: z.string(),
  keyhash: z.string(),
});
