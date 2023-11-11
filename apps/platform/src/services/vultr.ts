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

export async function createServerInstance() {
  return client.instances.createInstance({
    region: 'ams',
    plan: 'vc2-1c-1gb',
    os_id: '2136',
    script_id: 'ed24e203-6de9-44cf-8a16-ae8b31223c51',
  });
}

export async function deleteServerInstance(instanceId: string) {
  return client.instances.deleteInstance({ 'instance-id': instanceId });
}
