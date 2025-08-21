import { object, string, z, optional } from 'zod';

export const serverGetProfileXmlQueriesSchema = object({
  RCONPassword: string(),
  ServerName: string(),
  ServerPassword: optional(string()),
  DemoIndexURL: string(),
  DemoDownloadURL: string(),
  MaxPlayers: z.coerce.number(),
  InfantryOnly: z.coerce.boolean(),
});
