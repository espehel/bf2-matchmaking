import Vultr from '@vultr/vultr-node';
import { assertArray, assertObj, assertString } from '@bf2-matchmaking/utils';
import { Instance } from '@bf2-matchmaking/types';
import { info } from '@bf2-matchmaking/logging';

assertString(process.env.VULTR_API_KEY, 'VULTR_API_KEY is not set.');

const client = Vultr.initialize({
  apiKey: process.env.VULTR_API_KEY,
  rateLimit: 600,
});

let startupScripts = new Map<string, string>();
export async function loadStartupScripts() {
  const { startup_scripts } = await client.startupScripts.listStartupScripts({});
  assertArray(startup_scripts);
  startupScripts = new Map(
    (startup_scripts as Array<{ name: string; id: string }>).map(({ name, id }) => [
      name,
      id,
    ])
  );
  return startupScripts;
}

async function upsertStartupScript(name: string, script: string) {
  const startupScriptId = startupScripts.get(name);
  if (startupScriptId) {
    await client.startupScripts.updateStartupScript({
      'startup-id': startupScriptId,
      script,
    });
    return startupScriptId;
  }
  const { startup_script } = await client.startupScripts.createStartupScript({
    name,
    script,
  });
  return startup_script.id;
}

export async function getServerInstances() {
  return client.instances.listInstances({});
}

export async function createServerInstance(
  serverName: string,
  region: string,
  label: string,
  tag: string | undefined
) {
  const script = Buffer.from(generateStartupScript(serverName), 'utf8').toString(
    'base64'
  );
  const script_id = await upsertStartupScript(label, script);

  const { instance } = await client.instances.createInstance({
    region,
    plan: 'vhf-1c-1gb',
    os_id: '2136',
    script_id,
    label,
    tag,
  });
  return instance as Instance | undefined;
}

export async function deleteServerInstance(id: string) {
  const result = await client.instances.deleteInstance({ 'instance-id': id });
  return result;
}

export async function getInstanceByIp(ip: string): Promise<Instance | null> {
  const { instances } = await client.instances.listInstances({});
  assertArray(instances, 'Failed to get instances');

  const instance = (instances as Array<Instance>).find((i: any) => i.main_ip === ip);
  return instance || null;
}

export function pollInstance(id: string, cb: (instance: Instance) => Promise<boolean>) {
  const interval = setInterval(async () => {
    info('pollInstance', `Polling instance ${id}`);
    const { instance } = await client.instances.getInstance({ 'instance-id': id });
    if (await cb(instance)) {
      info('pollInstance', `Stop polling instance ${id}`);
      clearInterval(interval);
    }
  }, 10000);
  setTimeout(() => {
    clearInterval(interval);
  }, 100000 * 6);
}

function generateStartupScript(serverName: string) {
  return `#!/bin/bash


wget https://gist.githubusercontent.com/rkantos/308850b4b94a8c8bf5a3220811e93339/raw/bf2server_bf2cc_install.sh
cat <<"EOF" >/root/bf2.profile
export BF2SERVER_NAME="${serverName}"
export RCON_PORT="4711"
export RCON_PASSWORD="super123"
export GAME_PORT="16567"
EOF
chmod a+x bf2server_bf2cc_install.sh
./bf2server_bf2cc_install.sh -y -o -n -j -l`;
}
