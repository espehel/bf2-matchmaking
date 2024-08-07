'use server';
import { assertString, api } from '@bf2-matchmaking/utils';
import { redirect } from 'next/navigation';

export async function createServer(data: FormData) {
  const { addressInput, portInput, rconPortInput, rconPwInput } =
    Object.fromEntries(data);
  assertString(addressInput);
  assertString(portInput);
  assertString(rconPortInput);
  assertString(rconPwInput);

  const result = await api.live().postServers({
    ip: addressInput,
    rcon_pw: rconPwInput,
    port: portInput,
    rcon_port: rconPortInput,
  });

  if (result.data) {
    redirect(`/servers/${result.data.address}`);
  }

  return result;
}
