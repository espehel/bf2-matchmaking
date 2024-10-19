import { getJSON, verify } from '@bf2-matchmaking/utils';
import { ServerLocation } from '@bf2-matchmaking/types/server';

export async function getServerLocation(address: string) {
  return getJSON<ServerLocation>(`http://ip-api.com/json/${address}`).then(verify);
}
