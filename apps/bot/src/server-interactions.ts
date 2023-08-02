import { api, externalApi, mapIndexToEmoji } from '@bf2-matchmaking/utils';
import { RconBf2Server } from '@bf2-matchmaking/types';
import { error, logInternalApiError } from '@bf2-matchmaking/logging';

export const getServerStatus = (server: RconBf2Server) => {
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
export const getServerDescriptionWithIp = async (server: RconBf2Server) =>
  `${getServerStatus(server)}: ${server.name} [${server.ip}] (${await getServerLocation(
    server
  )})`;

export const getServerList = async () => {
  const { data, error: err } = await api.rcon().getServers();

  if (!data) {
    error('getServerList', err);
    return 'Failed to get server list';
  }
  return (await Promise.all(data.map(getServerDescription))).sort();
};

export const getServerInfoList = async () => {
  const { data, error: err } = await api.rcon().getServers();
  if (!data) {
    logInternalApiError('Failed to get Server Info List', err);
    return 'Failed to get server information';
  }
  return (await Promise.all(data.map(getServerDescriptionWithIp))).sort();
};

export const getServerTupleList = async (): Promise<
  Array<[RconBf2Server, string, string]>
> => {
  const { data, error: err } = await api.rcon().getServers();
  if (!data) {
    error('getServerTupleList', err);
    return [];
  }
  return (await Promise.all(data.map(withDescription))).sort(compareTuple).map(withEmoji);
};
const withDescription = async (
  server: RconBf2Server
): Promise<[RconBf2Server, string]> => {
  return [server, await getServerDescription(server)];
};
const compareTuple = (
  [, descriptionA]: [RconBf2Server, string],
  [, descriptionB]: [RconBf2Server, string]
) => descriptionA.localeCompare(descriptionB);

const withEmoji = (
  tuple: [RconBf2Server, string],
  index: number
): [RconBf2Server, string, string] => {
  return [...tuple, mapIndexToEmoji(index)];
};

export const isValidServer = (server: RconBf2Server) =>
  getServerStatus(server) === 'available';
