'use server';
import { ServersRow } from '@bf2-matchmaking/types';
import dns from 'dns';

export async function getJoinmeHref(server: ServersRow): Promise<string> {
  return new Promise<string>((resolve) => {
    dns.resolve4(server.ip, (err, addresses) => {
      const ip = addresses?.at(0);
      if (ip && !err) {
        resolve(`https://joinme.click/g/bf2/${ip}:${server.port}`);
      } else {
        resolve(`(https://joinme.click/g/bf2/${server.ip}:${server.port}`);
      }
    });
  });
}
