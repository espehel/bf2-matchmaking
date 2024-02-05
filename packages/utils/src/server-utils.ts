'use server';
import dns from 'dns';

export async function getJoinmeHref(ip: string, port: string): Promise<string> {
  return new Promise<string>((resolve) => {
    dns.resolve4(ip, (err, addresses) => {
      const ip = addresses?.at(0);
      if (ip && !err) {
        resolve(`https://joinme.click/g/bf2/${ip}:${port}`);
      } else {
        resolve(`https://joinme.click/g/bf2/${ip}:${port}`);
      }
    });
  });
}

export async function getJoinmeDirect(ip: string, port: string): Promise<string> {
  return new Promise<string>((resolve) => {
    dns.resolve4(ip, (err, addresses) => {
      const ip = addresses?.at(0);
      if (ip && !err) {
        resolve(`bf2://${ip}:${port}`);
      } else {
        resolve(`bf2://${ip}:${port}`);
      }
    });
  });
}
