import { api, assertObj, verify } from '@bf2-matchmaking/utils';
import { LiveServer } from '@bf2-matchmaking/types';

const validCountries = [
  'Denmark',
  'Germany',
  'United Kingdom',
  'The Netherlands',
  'Netherlands',
  'Czechia',
];

export async function getAvailableServer() {
  const servers = await api.live().getServers().then(verify);
  const server = servers.find(
    (s) => s.info.players.length === 0 && s.country && validCountries.includes(s.country)
  );
  assertObj(server, 'Failed to find available server');
  return server;
}

export async function getServerPlayers(server: LiveServer) {
  const { data } = await api.live().getServerPlayerList(server.address);
  return data || [];
}
