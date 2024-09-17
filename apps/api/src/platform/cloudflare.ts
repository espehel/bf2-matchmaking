import Cloudflare from 'cloudflare';
import { assertString } from '@bf2-matchmaking/utils';
import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { CLOUDFLARE } from './constants';
type ARecord = Cloudflare.DNS.Records.ARecord;

assertString(process.env.CLOUDFLARE_TOKEN, 'CLOUDFLARE_TOKEN is not set.');
const client = new Cloudflare({ apiToken: process.env.CLOUDFLARE_TOKEN });

export async function getDnsByName(name: string) {
  const hostname = name.endsWith(CLOUDFLARE.zone_name)
    ? name
    : `${name}.${CLOUDFLARE.zone_name}`;
  const response = await client.dns.records.list({
    zone_id: CLOUDFLARE.zone_id,
    name: hostname,
    type: 'A',
  });
  return (response.result?.at(0) as ARecord | undefined) || null;
}

export async function getDnsByIp(ip: string) {
  const response = await client.dns.records.list({
    zone_id: CLOUDFLARE.zone_id,
    content: ip,
    type: 'A',
  });
  return (response.result?.at(0) as ARecord | undefined) || null;
}

export async function createDnsRecord(name: string, ip: string) {
  info('createDnsRecord', `Creating DNS record ${name} for ip ${ip}.`);
  try {
    const record = (await client.dns.records.create({
      zone_id: CLOUDFLARE.zone_id,
      name,
      content: ip,
      proxied: false,
      type: 'A',
      ttl: 1,
    })) as ARecord;
    logMessage(`DNS ${name} created for ip ${ip}.`, { record });
    return record;
  } catch (e) {
    logErrorMessage('Could not create DNS record.', e, { name, ip });
    return null;
  }
}

export async function deleteDnsRecord(id: string) {
  return client.dns.records.delete(id, { zone_id: CLOUDFLARE.zone_id });
}
