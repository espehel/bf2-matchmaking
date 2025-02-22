import { PlayersRow } from '@bf2-matchmaking/types';
import { assertObj } from '@bf2-matchmaking/utils';
import { sign, verify } from 'jsonwebtoken';
import { JWTUserSchema } from './schemas';
import { set } from '@bf2-matchmaking/redis/set';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';

export function createToken(player: PlayersRow) {
  const { id, nick, keyhash } = player;
  assertObj(process.env.API_KEY, 'API_KEY not defined');
  return sign({ id, nick, keyhash }, process.env.API_KEY);
}

export async function verifyToken(token: string) {
  assertObj(process.env.API_KEY, 'API_KEY not defined');
  const payload = verify(token, process.env.API_KEY);
  const parsed = JWTUserSchema.parse(payload);

  const isMember = await set('players').isMember(parsed.id);
  if (isMember) {
    return parsed;
  }

  await client().getPlayer(parsed.id).then(verifySingleResult);
  await set('players').add(parsed.id);
  return parsed;
}
