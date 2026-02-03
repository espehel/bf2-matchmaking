import { MatchesRow } from '@bf2-matchmaking/types';
import { retry, wait } from '@bf2-matchmaking/utils';
import { client } from '@bf2-matchmaking/supabase';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { Instance } from '@bf2-matchmaking/types/platform';
import {
  deleteInstance,
  getDnsRecord,
  getInstancesByMatchId,
} from '../platform/platform-service';
import { Server } from '@bf2-matchmaking/services/server/Server';

export async function handleMatchClosed(match: MatchesRow) {
  const instances = await getInstancesByMatchId(match.id);
  if (instances.length > 0) {
    await Promise.all(
      instances.map(async (instance) => {
        await retry(() => deleteServerInstance(match, instance), 5);
      })
    );
  }

  const { data: challenge } = await client().getChallengeByMatchId(match.id);
  if (challenge) {
    await client().updateChallenge(challenge.id, { status: 'closed' });
  }
}

async function deleteServerInstance(match: MatchesRow, instance: Instance) {
  await wait(30);
  const address = await getAddress(instance.main_ip);
  try {
    await deleteInstance(address);
    await Server.delete(address);
    const { data: server } = await client().deleteServer(address);
    const { data: rcon } = await client().deleteServerRcon(address);
    logMessage(`Match ${match.id} deleted server instance ${address}`, {
      address,
      instance,
      server,
      rcon,
    });
  } catch (e) {
    logErrorMessage(`Match ${match.id} failed to delete server`, e, {
      address,
      instance,
      match,
    });
    throw e;
  }
}

async function getAddress(ip: string) {
  try {
    const dns = await getDnsRecord(ip);
    return dns.name;
  } catch (e) {
    return ip;
  }
}
