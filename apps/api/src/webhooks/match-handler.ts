import { MatchesRow } from '@bf2-matchmaking/types';
import { retry, wait } from '@bf2-matchmaking/utils';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { Instance } from '@bf2-matchmaking/types/platform';
import {
  deleteInstance,
  getDnsRecord,
  getInstancesByMatchId,
} from '../platform/platform-service';
import { deleteServer } from '../servers/server-service';
import { patchGuildScheduledEvent } from '@bf2-matchmaking/discord';

export async function handleMatchScheduledAtUpdate(match: MatchesRow) {
  try {
    if (match.events.length > 0) {
      await updateDiscordEvents(match);
      info(
        'handleMatchScheduledAtUpdate',
        `Match ${match.id}: ${match.events.length} discord events updated`
      );
    }
  } catch (e) {
    logErrorMessage(`Match ${match.id} failed to handle scheduled_at update`, e, {
      match,
    });
  }
}

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
    await deleteServer(address);
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

async function updateDiscordEvents(match: MatchesRow) {
  const { scheduled_at, events, id } = match;
  const { guild } = await client().getMatchConfig(id).then(verifySingleResult);
  if (guild && scheduled_at) {
    await Promise.all(
      events.map((eventId) =>
        patchGuildScheduledEvent(guild, eventId, {
          scheduled_start_time: scheduled_at,
        })
      )
    );
  }
}
