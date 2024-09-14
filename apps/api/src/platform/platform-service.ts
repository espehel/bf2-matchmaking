import { getInstanceByIp } from './vultr';
import { createDnsRecord } from './cloudflare';
import { ServiceError } from '@bf2-matchmaking/services/error';
import { DnsRecord } from '@bf2-matchmaking/types/platform';

export async function createServerDns(address: string): Promise<DnsRecord> {
  const instance = await getInstanceByIp(address);
  if (!instance) {
    throw ServiceError.NotFound('Instance not found');
  }

  if (!instance.tag) {
    throw ServiceError.InvalidRequest('Instance does not contain tag');
  }

  const dns = await createDnsRecord(instance.tag, address);
  if (!dns) {
    throw ServiceError.InternalServerError('Failed to create DNS record');
  }
  return dns;
}
