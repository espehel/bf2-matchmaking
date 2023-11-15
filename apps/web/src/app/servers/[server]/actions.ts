'use server';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { isNotNull, isString, ServerRconsUpdate } from '@bf2-matchmaking/types';
import { revalidatePath } from 'next/cache';
import { hasError } from '@bf2-matchmaking/supabase/src/error-handling';
import { api } from '@bf2-matchmaking/utils';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';

export async function updateServer(ip: string, data: FormData) {
  const portInput = data.get('portInput');
  const serverUpdate =
    portInput && isString(portInput)
      ? supabase(cookies).updateServer(ip, { port: portInput })
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
  const platformResult = await api.platform().deleteServer(ip);
  if (platformResult.error) {
    logErrorMessage(`Server ${ip}: Failed to delete from platform`, platformResult.error);
  }
  const rconResult = await supabase(cookies).deleteServerRcon(ip);
  if (rconResult.error) {
    logErrorMessage(
      `Server ${ip}: Failed to delete rcon from database`,
      rconResult.error
    );
    return rconResult;
  }

  const serverResult = await supabase(cookies).deleteServer(ip);
  if (serverResult.error) {
    logErrorMessage(
      `Server ${ip}: Failed to delete server from database`,
      serverResult.error
    );
    return serverResult;
  }
  logMessage(`Server ${ip}: Deleted successfully`, {
    platformResult,
    rconResult,
    serverResult,
  });
  return serverResult;
}
