import { MatchesJoined, MatchStatus, ServersRow } from '@bf2-matchmaking/types';
import { api, isClosedMatch, isOpenMatch } from '@bf2-matchmaking/utils';
import { client } from '@bf2-matchmaking/supabase';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { retry, wait } from '@bf2-matchmaking/utils/src/async-actions';
import { putMatch, removeMatch } from '@bf2-matchmaking/redis/matches';
import { Instance } from '@bf2-matchmaking/types/platform';

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
  const [liveMatch, liveServer] = await startLiveMatch(match, null);
  if (liveMatch) {
    logMessage(`Match ${match.id} live tracking started`, {
      match,
      liveMatch,
      liveServer,
    });
  }
}
async function handleMatchFinished(match: MatchesJoined) {
  const { data: instances } = await api.platform().getServers(match.id);
  if (instances && instances.length > 0) {
    await Promise.all(
      instances.map(async (instance) => {
        await retry(() => deleteInstance(match, instance), 5);
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

async function deleteInstance(match: MatchesJoined, instance: Instance) {
  await wait(30);
  const address = await getAddress(instance.main_ip);
  const result = await api.platform().deleteServer(address);
  if (result.data) {
    const { data: server } = await client().deleteServer(address);
    const { data: rcon } = await client().deleteServerRcon(address);
    logMessage(`Match ${match.id} deleted server instance ${address}`, {
      address,
      instance,
      server,
      rcon,
    });
  }
  if (result.error) {
    logErrorMessage(`Match ${match.id} failed to delete server`, result.error, {
      address,
      instance,
    });
  }
  return result;
}

async function startLiveMatch(
  match: MatchesJoined,
  server: ServersRow | null
): Promise<[unknown, unknown]> {
  const { data: liveMatch, error } = await api.live().postMatch(match.id);
  if (error) {
    logErrorMessage(`Match ${match.id} failed to start live match`, error, {
      match,
    });
    return [null, null];
  }

  if (!server) {
    return [liveMatch, null];
  }
  const { data: liveServer, error: liveServerError } = await api
    .live()
    .postMatchServer(match.id, server.ip, false);
  if (liveServerError) {
    logErrorMessage(
      `Match ${match.id} failed to set live match server`,
      liveServerError,
      {
        match,
        server,
        liveMatch,
      }
    );
  }
  return [liveMatch, liveServer];
}

async function getAddress(ip: string) {
  const { data: dns } = await api.platform().getServerDns(ip);
  return dns?.name || ip;
}
