import Vultr from '@vultr/vultr-node';
import { assertArray, assertObj, assertString } from '@bf2-matchmaking/utils';
import { Instance, Plan, Region, StartupScript } from '@bf2-matchmaking/types/platform';
import { info, logMessage } from '@bf2-matchmaking/logging';
import { VULTR } from './constants';

assertString(process.env.VULTR_API_KEY, 'VULTR_API_KEY is not set.');

const client = Vultr.initialize({
  apiKey: process.env.VULTR_API_KEY,
  rateLimit: 600,
});

export async function deleteStartupScript(name: string) {
  const { startup_scripts } = (await client.startupScripts.listStartupScripts({})) as {
    startup_scripts: Array<StartupScript>;
  };

  const script = startup_scripts.find((s) => s.name === name);
  if (script) {
    await client.startupScripts.deleteStartupScript({ 'startup-id': script.id });
  }
}

async function createStartupScript(name: string, script: string) {
  const { startup_script } = await client.startupScripts.createStartupScript({
    name,
    script,
  });
  return startup_script.id;
}

export async function getServerInstances(matchId?: string) {
  const { instances } = await client.instances.listInstances({});
  assertArray(instances, 'Failed to get instances');

  if (matchId) {
    return (instances as Array<Instance>).filter((i) => i.tag === matchId);
  }

  return instances as Array<Instance>;
}

export async function createServerInstance(
  serverName: string,
  region: string,
  match: string,
  map: string,
  vehicles: string
) {
  const script = Buffer.from(
    generateStartupScript(serverName, match, map, vehicles),
    'utf8'
  ).toString('base64');
  const script_id = await createStartupScript(serverName, script);

  const { instance } = await client.instances.createInstance({
    region,
    plan: region === 'sao' ? VULTR.sao_plan : VULTR.plan,
    os_id: VULTR.os_id,
    script_id,
    label: serverName,
    tag: match,
  });
  logMessage(`Server instance ${instance?.tag} with ip ${instance?.id} created`, {
    serverName,
    region,
    match,
    map,
    vehicles,
  });
  return instance as Instance | undefined;
}

export async function deleteServerInstance(id: string) {
  return client.instances.deleteInstance({ 'instance-id': id });
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

export async function getRegions() {
  const { plans } = await client.plans.listPlans({ type: VULTR.type });
  assertArray(plans, 'Failed to get plans');
  const validPlans = (plans as Array<Plan>).filter(
    (p) => p.id === VULTR.plan || p.id === VULTR.sao_plan
  );
  assertObj(validPlans.at(0), 'Failed to find plan');

  const { regions } = await client.regions.listRegions({});
  assertObj(regions, 'Failed to get regions');

  return (regions as Array<Region>).filter((r) =>
    validPlans.some((plan) => plan.locations.includes(r.id))
  );
}

function generateStartupScript(
  serverName: string,
  matchId: string,
  map: string,
  vehicles: string
) {
  return `#!/bin/bash


wget https://gist.githubusercontent.com/rkantos/308850b4b94a8c8bf5a3220811e93339/raw/bf2server_bf2cc_install.sh
cat <<"EOF" >/root/bf2.profile
export BF2SERVER_NAME="${serverName}"
export BF2_GG_MATCH_ID="${matchId}"
export BF2_MAP="${map}"
export BF2_VEHICLE="${vehicles}"
export RCON_PORT="4711"
export RCON_PASSWORD="super123"
export GAME_PORT="16567"
EOF
chmod a+x bf2server_bf2cc_install.sh
./bf2server_bf2cc_install.sh -y -o -n -j -l -p`;
}
