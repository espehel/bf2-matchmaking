import { LiveInfo } from '@bf2-matchmaking/types';
import { topic } from '@bf2-matchmaking/redis/topic';
import { getServerLiveInfo } from '@bf2-matchmaking/redis/servers';
import { info } from '@bf2-matchmaking/logging';
import { ServerInfoStream } from './ServerInfoStream';

const clients = new Map<string, Set<ServerInfoStream>>();
const serverTopic = topic('servers:info');
let subscribed = false;

function handleMessage({ address, info: liveInfo }: { address: string; info: LiveInfo }) {
  const streams = clients.get(address);
  if (streams) {
    for (const stream of streams) {
      stream.writeInfo(liveInfo);
    }
  }
}

async function ensureSubscribed() {
  if (!subscribed) {
    subscribed = true;
    await serverTopic.subscribe(handleMessage);
    info('server-info-broadcaster', 'Subscribed to servers:info topic');
  }
}

async function maybeUnsubscribe() {
  if (subscribed && clients.size === 0) {
    subscribed = false;
    await serverTopic.unsubscribe();
    info('server-info-broadcaster', 'Unsubscribed from servers:info topic');
  }
}

export async function addClient(address: string, stream: ServerInfoStream) {
  await ensureSubscribed();

  let set = clients.get(address);
  if (!set) {
    set = new Set();
    clients.set(address, set);
  }
  set.add(stream);

  const currentInfo = await getServerLiveInfo(address);
  if (currentInfo) {
    stream.writeInfo(currentInfo);
  }
}

export function removeClient(address: string, stream: ServerInfoStream) {
  const set = clients.get(address);
  if (set) {
    set.delete(stream);
    if (set.size === 0) {
      clients.delete(address);
    }
  }
  maybeUnsubscribe();
}
