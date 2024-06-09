'use server';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import {
  isNotNull,
  isString,
  ServerRconsUpdate,
  ServersUpdate,
} from '@bf2-matchmaking/types';
import { revalidatePath } from 'next/cache';
import { hasError } from '@bf2-matchmaking/supabase/src/error-handling';
import { api } from '@bf2-matchmaking/utils';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';

export async function pauseRound(address: string) {
  const result = await api.live().postServerPause(address);

  if (!result.error) {
    revalidatePath(`/servers/${address}`);
  }

  return result;
}

export async function unpauseRound(address: string) {
  const result = await api.live().postServerUnpause(address);

  if (!result.error) {
    revalidatePath(`/servers/${address}`);
  }
  return result;
}

export async function restartRound(address: string) {
  const result = await api.live().postServerExec(address, { cmd: 'admin.restartMap' });

  if (!result.error) {
    revalidatePath(`/servers/${address}`);
  }

  return result;
}

export async function restartServerInfantry(ip: string) {
  const result = await api.live().postServerRestart(ip, { mode: 'infantry' });
  if (!result.error) {
    revalidatePath(`/servers/${ip}`);
  }
  return result;
}

export async function restartServerVehicles(ip: string) {
  const result = await api.live().postServerRestart(ip, { mode: 'vehicles' });
  if (!result.error) {
    revalidatePath(`/servers/${ip}`);
  }
  return result;
}

export async function updateServer(ip: string, data: FormData) {
  const { portInput, demosInput } = Object.fromEntries(data);
  let serverValues: ServersUpdate = {};
  if (isString(portInput)) {
    serverValues.port = portInput;
  }
  if (isString(demosInput)) {
    serverValues.demos_path = demosInput;
  }

  const serverUpdate =
    Object.keys(serverValues).length > 0
      ? supabase(cookies).updateServer(ip, serverValues)
      : null;

  const rconValues = toRconUpdateValues(data);
  const rconUpdate = rconValues
    ? supabase(cookies).updateServerRcon(ip, rconValues)
    : null;

  const results = await Promise.all([serverUpdate, rconUpdate].filter(isNotNull));
  if (results.some(hasError)) {
    return { ok: false };
  }
  revalidatePath(`/servers/${ip}`);
  return { ok: true };
}

const toRconUpdateValues = (data: FormData) => {
  const values: ServerRconsUpdate = {};

  const port = data.get('rconPortInput');
  if (port && isString(port)) {
    values.rcon_port = parseInt(port);
  }

  const pw = data.get('rconPwInput');
  if (pw && isString(pw)) {
    values.rcon_pw = pw;
  }

  if (Object.keys(values).length === 0) {
    return null;
  }

  return values;
};

export async function deleteServer(ip: string) {
  const serverResult = await supabase(cookies).deleteServer(ip);
  if (serverResult.error) {
    logErrorMessage(
      `Server ${ip}: Failed to delete server from database`,
      serverResult.error
    );
    return serverResult;
  }

  const [platformResult, rconResult, liveResult] = await Promise.all([
    api.platform().deleteServer(ip),
    supabase(cookies).deleteServerRcon(ip),
    api.live().deleteServer(ip),
  ]);

  if (platformResult.error && platformResult.status !== 404) {
    logErrorMessage(
      `Server ${ip}: Failed to delete from platform`,
      platformResult.error,
      { status: platformResult.status }
    );
  }
  if (rconResult.error) {
    logErrorMessage(
      `Server ${ip}: Failed to delete rcon from database`,
      rconResult.error
    );
    return rconResult;
  }
  if (liveResult.error) {
    logErrorMessage(`Server ${ip}: Failed to delete server from live`, liveResult.error);
    return liveResult;
  }

  logMessage(`Server ${ip}: Deleted successfully`, {
    platformResult,
    rconResult,
    serverResult,
    liveResult,
  });
  revalidatePath(`/servers`);
  return serverResult;
}
