import { api, externalApi } from '@bf2-matchmaking/utils';
import { RconBf2Server } from '@bf2-matchmaking/types';

const getServerStatus = (server: RconBf2Server) => {
  if (server.matches.length > 0) {
    return 'unavailable';
  }
  if (!server.info) {
    return 'offline';
  }
  if (parseInt(server.info.connectedPlayers) > 0) {
    return 'in use';
  }
  return 'available';
};

const getServerLocation = async (server: RconBf2Server) => {
  const { data } = await externalApi.ip().getIpLocation(server.ip);
  if (data) {
    return `${data.city}, ${data.countryCode}`;
  }
  return '';
};

export const getServerDescription = async (server: RconBf2Server) =>
  `${getServerStatus(server)}: ${server.name} (${await getServerLocation(server)})`;

export const getServerList = async () => {
  const { data } = await api.rcon().getServers();

  if (!data) {
    return 'Failed to get server list';
  }
  return (await Promise.all(data.map(getServerDescription))).join('\n');
};

export const isValidServer = (server: RconBf2Server) =>
  getServerStatus(server) === 'available';
