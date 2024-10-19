import {
  PlayerListItem,
  ServerInfo,
  PostServerExecRequestBody,
  PostServerExecResponseBody,
  LiveMatch,
  PostServerPlayersSwitchRequestBody,
  PostServersRequestBody,
  PostRestartServerRequestBody,
  ServersRow,
  MatchesJoined,
  PostMatchRequestBody,
} from '@bf2-matchmaking/types';
import { deleteJSON, getJSON, postJSON } from './fetcher';
import {
  Instance,
  DnsRecordWithoutPriority,
  Region,
} from '@bf2-matchmaking/types/platform';
import { LiveServer } from '@bf2-matchmaking/types/server';

const web = () => {
  const basePath = 'https://bf2.gg';
  return {
    basePath,
    matchPage: (matchId: number | string, playerId?: string) =>
      `${basePath}/matches/${matchId}${playerId ? `?player=${playerId}` : ''}`,
    teamspeakPage: (id: string) =>
      new URL(`${basePath}/players/teamspeak/?tsid=${id}`).toString(),
  };
};
const live = () => {
  const basePath = 'https://api.bf2.gg';
  const paths = {
    servers: () => '/servers',
    server: (ip: string) => `/servers/${ip}`,
    serverInfo: (ip: string) => `/servers/${ip}/si`,
    serverPlayerList: (ip: string) => `/servers/${ip}/pl`,
    serverExec: (ip: string) => `/servers/${ip}/exec`,
    serverPause: (ip: string) => `/servers/${ip}/pause`,
    serverUnpause: (ip: string) => `/servers/${ip}/unpause`,
    serverRestart: (ip: string) => `/servers/${ip}/restart`,
    serverPlayersSwitch: (ip: string) => `/servers/${ip}/players/switch`,
    serverMaps: (ip: string) => `/servers/${ip}/maps`,
    matches: () => '/matches',
    match: (matchId: number) => `/matches/${matchId}`,
    matchServer: (matchId: number) => `/matches/${matchId}/server`,
    matchResults: (matchId: number) => `/matches/${matchId}/results`,
  };
  return {
    paths,
    postServers: (body: PostServersRequestBody) =>
      postJSON<LiveServer>(basePath.concat(paths.servers()), body),
    getServerInfo: (ip: string) =>
      getJSON<ServerInfo>(basePath.concat(paths.serverInfo(ip)), { cache: 'no-store' }),
    postServerExec: (ip: string, body: PostServerExecRequestBody) =>
      postJSON<PostServerExecResponseBody>(basePath.concat(paths.serverExec(ip)), body),
    postServerRestart: (ip: string, body: PostRestartServerRequestBody) =>
      postJSON<PostServerExecResponseBody>(
        basePath.concat(paths.serverRestart(ip)),
        body
      ),
    postServerPause: (ip: string) => postJSON(basePath.concat(paths.serverPause(ip)), {}),
    postServerUnpause: (ip: string) =>
      postJSON(basePath.concat(paths.serverUnpause(ip)), {}),
    postServerPlayersSwitch: (ip: string, body: PostServerPlayersSwitchRequestBody) =>
      postJSON(basePath.concat(paths.serverPlayersSwitch(ip)), {}),
    postServerMaps: (ip: string, map: number) =>
      postJSON(basePath.concat(paths.serverMaps(ip)), { map }),
    getServerPlayerList: (ip: string) =>
      getJSON<Array<PlayerListItem>>(basePath.concat(paths.serverPlayerList(ip)), {
        next: { tags: ['getServerPlayerList'] },
      }),
    getServers: () =>
      getJSON<Array<LiveServer>>(basePath.concat(paths.servers()), {
        next: { revalidate: 600 },
      }),
    getServer: (ip: string) =>
      getJSON<LiveServer>(basePath.concat(paths.server(ip)), {
        cache: 'no-store',
      }),
    deleteServer: (ip: string) =>
      deleteJSON<LiveServer>(basePath.concat(paths.server(ip))),
    postMatch: (matchId: number) => postJSON(`${basePath}${paths.match(matchId)}`, {}),
    postMatchServer: (matchId: number, address: string, force: boolean) =>
      postJSON(`${basePath}${paths.matchServer(matchId)}?force=${force}`, { address }),
    getMatches: () => getJSON<Array<LiveMatch>>(basePath.concat(paths.matches())),
    getMatch: (matchId: number) =>
      getJSON<LiveMatch>(basePath.concat(paths.match(matchId))),
    getMatchServer: (matchId: number) =>
      getJSON<ServersRow | null>(basePath.concat(paths.matchServer(matchId))),
    postMatchResults: (matchId: number) =>
      postJSON(basePath.concat(paths.matchResults(matchId)), {}),
  };
};

const platform = () => {
  const basePath = 'https://api.bf2.gg/platform';
  const paths = {
    servers: () => '/servers',
    server: (ip: string) => `/servers/${ip}`,
    serverDns: (ip: string) => `/servers/${ip}/dns`,
    regions: () => '/regions',
  };
  return {
    postServers: (
      name: string,
      region: string,
      match: string | number,
      map: string | null,
      vehicles: string | null,
      subDomain: string
    ) =>
      postJSON<Instance>(basePath.concat(paths.servers()), {
        name,
        region,
        match,
        map,
        vehicles,
        subDomain,
      }),
    getServers: (match?: string | number) =>
      getJSON<Array<Instance>>(
        basePath.concat(paths.servers().concat(match ? `?match=${match}` : '')),
        {
          cache: 'no-store',
          next: { tags: ['platformGetServers'] },
        }
      ),
    getServer: (ip: string) => getJSON<Instance>(basePath.concat(paths.server(ip))),
    getServerDns: (ip: string) =>
      getJSON<DnsRecordWithoutPriority>(basePath.concat(paths.serverDns(ip))),
    getRegions: () => getJSON<Array<Region>>(basePath.concat(paths.regions())),
  };
};

const basePath = 'https://api.bf2.gg';
const matches = `${basePath}/matches`;
const servers = `${basePath}/servers`;
const admin = `${basePath}/admin`;
const v2 = {
  getHealth: () => getJSON(`${basePath}/health`, { signal: AbortSignal.timeout(5000) }),
  postMatch: (body: PostMatchRequestBody) => postJSON<MatchesJoined>(`${matches}`, body),
  deleteServer: (address: string) => deleteJSON(`${servers}/${address}`),
  adminReset: () => postJSON(`${admin}/reset`, {}),
};

export const api = {
  live,
  web,
  platform,
  v2,
};

export const engine = {
  getHealth: () =>
    getJSON<string>(`https://engine.bf2.gg/health`, {
      signal: AbortSignal.timeout(5000),
    }),
};
