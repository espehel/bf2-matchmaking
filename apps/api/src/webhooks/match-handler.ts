import { LiveMatch, MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { isClosedMatch, isOpenMatch, retry, wait } from '@bf2-matchmaking/utils';
import { client } from '@bf2-matchmaking/supabase';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { putMatch, removeMatch } from '@bf2-matchmaking/redis/matches';
import { Instance } from '@bf2-matchmaking/types/platform';
import { createPendingMatch } from '../matches/match-service';
import {
  deleteInstance,
  getDnsRecord,
  getInstancesByMatchId,
} from '../platform/platform-service';
import { deleteServer } from '../servers/server-service';

export async function handleMatchInserted(match: MatchesJoined) {
  try {
    if (isOpenMatch(match)) {
      await putMatch(match);
    }
    /*if (match.status === MatchStatus.Summoning) {
    await joinMatchRoom(match);
  }*/
    if (match.status === MatchStatus.Ongoing) {
      await handleMatchOngoing(match);
    }
  } catch (e) {
    logErrorMessage(`Match ${match.id} failed to handle insertion`, e, { match });
  }
}
export async function handleMatchStatusUpdate(match: MatchesJoined) {
  try {
    if (isOpenMatch(match)) {
      await putMatch(match);
    }
    if (isClosedMatch(match)) {
      await removeMatch(match);
    }

    if (match.status === MatchStatus.Summoning) {
      //await joinMatchRoom(match);
    }
    if (match.status === MatchStatus.Ongoing) {
      await handleMatchOngoing(match);
      //await broadcastMatchStart(match);
    }
    if (match.status === MatchStatus.Finished) {
      await handleMatchFinished(match);
    }
  } catch (e) {
    logErrorMessage(`Match ${match.id} failed to handle update`, e, { match });
  }
}

async function handleMatchOngoing(match: MatchesJoined) {
  const liveMatch = await startLiveMatch(match);
  if (liveMatch) {
    logMessage(`Match ${match.id} live tracking started`, {
      match,
      liveMatch,
    });
  }
}
async function handleMatchFinished(match: MatchesJoined) {
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

  //leaveMatchRoom(match);
}

/*function handleMatchSummoning(match: MatchesJoined) {
  joinMatchRoom(match);
}*/

async function deleteServerInstance(match: MatchesJoined, instance: Instance) {
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

async function startLiveMatch(match: MatchesJoined): Promise<LiveMatch | null> {
  return createPendingMatch(match);
}

async function getAddress(ip: string) {
  try {
    const dns = await getDnsRecord(ip);
    return dns.name;
  } catch (e) {
    return ip;
  }
}
