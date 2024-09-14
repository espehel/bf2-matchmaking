import Cloudflare from 'cloudflare';
import { assertString } from '@bf2-matchmaking/utils';
import { DnsRecord, ResponseObject } from '@bf2-matchmaking/types/platform';
import { info, logMessage } from '@bf2-matchmaking/logging';
import { CLOUDFLARE } from './constants';

assertString(process.env.CLOUDFLARE_TOKEN, 'CLOUDFLARE_TOKEN is not set.');
const client = new Cloudflare({ token: process.env.CLOUDFLARE_TOKEN });

export async function getDnsByName(name: string) {
  const hostname = name.endsWith(CLOUDFLARE.zone_name)
    ? name
    : `${name}.${CLOUDFLARE.zone_name}`;
  // @ts-expect-error
  const response = (await client.dnsRecords.browse<'A'>(CLOUDFLARE.zone_id, {
    name: hostname,
  })) as ResponseObject<Array<DnsRecord>>;
  return response.result?.at(0) || null;
}

export async function getDnsByIp(ip: string) {
  // @ts-expect-error
  const response = (await client.dnsRecords.browse<'A'>(CLOUDFLARE.zone_id, {
    content: ip,
  })) as ResponseObject<Array<DnsRecord>>;
  return response.result?.at(0) || null;
}

export async function createDnsRecord(name: string, ip: string) {
  info('createDnsRecord', `Creating DNS record ${name} for ip ${ip}.`);
  const response = (await client.dnsRecords.add(CLOUDFLARE.zone_id, {
    name,
    content: ip,
    proxied: false,
    type: 'A',
    ttl: 1,
  })) as ResponseObject<DnsRecord>;
  if (response.success) {
    logMessage(`DNS ${name} created for ip ${ip}.`, { response });
    return response.result;
  }
  logMessage('Could not create DNS record.', { response, name, ip });
  return null;
}

export async function deleteDnsRecord(
  id: string
): Promise<ResponseObject<{ id: string }>> {
  // @ts-expect-error
  return client.dnsRecords.del(CLOUDFLARE.zone_id, id);
}
