import Cloudflare, { DnsRecordByType } from 'cloudflare';
import { assertString } from '@bf2-matchmaking/utils';
import { DnsRecordWithoutPriority, ResponseObject } from '@bf2-matchmaking/types';
import { logMessage } from '@bf2-matchmaking/logging';

assertString(process.env.CLOUDFLARE_TOKEN, 'CLOUDFLARE_TOKEN is not set.');
const client = new Cloudflare({ token: process.env.CLOUDFLARE_TOKEN });

export async function getDnsByName(name: string) {
  const response = (await client.dnsRecords.browse<'A'>(
    'e553f5c69485773f5aae5b2818ba3308',
    {
      name,
    }
  )) as ResponseObject<Array<DnsRecordWithoutPriority>>;
  return response.result?.at(0) || null;
}

export async function createDnsRecord(name: string, ip: string) {
  const response = (await client.dnsRecords.add('e553f5c69485773f5aae5b2818ba3308', {
    name,
    content: ip,
    proxied: false,
    type: 'A',
    ttl: 1,
  })) as ResponseObject<DnsRecordByType<'A'>>;
  if (response.success) {
    logMessage(`Created DNS record for ${name}.`, { response, ip });
    return response.result;
  }
  logMessage('Could not create DNS record.', { response, name, ip });
  return null;
}
