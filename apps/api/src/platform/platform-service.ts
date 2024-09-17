import {
  deleteServerInstance,
  deleteStartupScript,
  getInstanceByIp,
  getServerInstances,
} from './vultr';
import { createDnsRecord, deleteDnsRecord, getDnsByIp, getDnsByName } from './cloudflare';
import { ServiceError } from '@bf2-matchmaking/services/error';
import { error, info } from '@bf2-matchmaking/logging';
import { getServerLiveInfo } from '@bf2-matchmaking/redis/servers';

export async function createServerDns(address: string) {
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

export async function getInstancesByMatchId(
  matchId: string | number | string[] | undefined
) {
  if (!(typeof matchId === 'number' || typeof matchId === 'string')) {
    throw ServiceError.InvalidRequest('Invalid match id');
  }

  return getServerInstances(matchId.toString());
}

export async function deleteInstance(ip: string) {
  const dns = await getDnsByName(ip);
  const instance = await getInstanceByIp(dns?.content || ip);

  if (!instance) {
    error(
      'deleteInstance',
      `Server ${ip} not found {content: "${dns?.content}", name: "${dns?.name}"}`
    );
    throw ServiceError.NotFound('Server not found');
  }

  const host = dns?.name || ip;

  const live = await getServerLiveInfo(host);
  if (live && Number(live.connectedPlayers) > 3) {
    throw ServiceError.Conflict('Server is not empty');
  }

  // TODO fix: could use vercel blob + redis stream
  //await saveDemosAll(host);

  await Promise.all([
    await deleteServerInstance(instance.id),
    await deleteStartupScript(instance.label),
  ]);

  if (dns?.id) {
    await deleteDnsRecord(dns.id);
  }

  info(
    'DELETE /servers/:ip',
    `Instance ${host} deleted. [id: "${instance.id}", dns content: "${dns?.content}", tag: "${instance.tag}", label: "${instance.label}"]`
  );
  return instance;
}

export async function getDnsRecord(
  identifier: string,
  type: 'ip' | 'name' | unknown = 'ip'
) {
  const dns =
    type === 'ip' ? await getDnsByIp(identifier) : await getDnsByName(identifier);
  if (!dns) {
    throw ServiceError.NotFound(`Could not find DNS record with ip ${identifier}`);
  }
  return dns;
}
