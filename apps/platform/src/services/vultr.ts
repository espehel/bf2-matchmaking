import Vultr from '@vultr/vultr-node';
import { assertString } from '@bf2-matchmaking/utils';

assertString(process.env.VULTR_API_KEY, 'VULTR_API_KEY is not set.');

const client = Vultr.initialize({
  apiKey: process.env.VULTR_API_KEY,
  rateLimit: 600,
});

export async function getServerInstances() {
  return client.instances.listInstances({});
}

export async function createServerInstance(serverName: string, region: string) {
  const script = Buffer.from(generateStartupScript(serverName), 'utf8').toString(
    'base64'
  );
  const { startup_script } = await client.startupScripts.createStartupScript({
    name: `${serverName} script`,
    script,
  });

  const { instance } = await client.instances.createInstance({
    region,
    plan: 'vc2-1c-1gb',
    os_id: '2136',
    script_id: startup_script.id,
  });

  //await client.startupScripts.deleteStartupScript({ 'startup-id': startup_script.id });

  return instance;
}

export async function deleteServerInstance(instanceId: string) {
  return client.instances.deleteInstance({ 'instance-id': instanceId });
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
