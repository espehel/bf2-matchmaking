import { QueryProtocol, TeamSpeak } from 'ts3-nodejs-library';
import { assertString } from '@bf2-matchmaking/utils';
import { error, warn } from '@bf2-matchmaking/logging/winston';

let client: TeamSpeak | null = null;
let isConnected = false;

export async function createClient() {
  assertString(process.env.TEAMSPEAK_PASSWORD, 'TEAMSPEAK_PASSWORD not defined');
  const ts = await TeamSpeak.connect({
    host: 'oslo21.spillvert.no',
    queryport: 10022,
    protocol: QueryProtocol.SSH,
    serverport: 10014,
    username: 'bf2.gg',
    password: process.env.TEAMSPEAK_PASSWORD,
    nickname: 'bf2.gg',
  });
  isConnected = true;
  ts.on('close', () => {
    warn('TeamspeakBot', 'Teamspeak connection closed');
    isConnected = false;
  });
  ts.on('error', (err) => {
    error('TeamspeakBot failed', err);
    isConnected = false;
  });
  return ts;
}

export async function getClient() {
  if (!client) {
    client = await createClient();
    return client;
  }
  if (!isConnected) {
    await client.reconnect();
    isConnected = true;
  }
  return client;
}
