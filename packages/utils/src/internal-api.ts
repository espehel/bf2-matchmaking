import {
  PlayerListItem,
  PostServerExecRequestBody,
  PostServerExecResponseBody,
  LiveMatch,
  PostServerPlayersSwitchRequestBody,
  PostServersRequestBody,
  PostRestartServerRequestBody,
  ServersRow,
  MatchesJoined,
  PostMatchRequestBody,
  GetGatherResponse,
} from '@bf2-matchmaking/types';
import {
  deleteJSON,
  getEventSource,
  getJSON,
  postJSON,
  postWithApiKeyJSON,
  toBearerRequestInit,
} from './fetcher';
import {
  Instance,
  DnsRecordWithoutPriority,
  Region,
} from '@bf2-matchmaking/types/platform';
import {
  ConnectedLiveServer,
  LiveServer,
  ServerLogEntry,
  ServersLogs,
} from '@bf2-matchmaking/types/server';
import { StreamEventReply } from '@bf2-matchmaking/types/redis';

const web = () => {
  const basePath = 'https://bf2.top';
  return {
    basePath,
    matchPage: (matchId: number | string, playerId?: string) =>
      `${basePath}/matches/${matchId}${playerId ? `?player=${playerId}` : ''}`,
    teamspeakPage: (id: string) =>
      new URL(`${basePath}/players/teamspeak/?tsid=${id}`).toString(),
  };
};
const live = () => {
  const basePath = 'https://api.bf2.top';
  const paths = {
    servers: () => '/servers',
    server: (ip: string) => `/servers/${ip}`,
    serverInfo: (ip: string) => `/servers/${ip}/si`,
    serverPlayerList: (ip: string) => `/servers/${ip}/pl`,
    serverPause: (ip: string) => `/servers/${ip}/pause`,
    serverUnpause: (ip: string) => `/servers/${ip}/unpause`,
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
        next: { revalidate: 60 },
      }),
    getServer: (ip: string) =>
      getJSON<LiveServer>(basePath.concat(paths.server(ip)), {
        cache: 'no-store',
      }),
    deleteServer: (ip: string) =>
      deleteJSON<LiveServer>(basePath.concat(paths.server(ip))),
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
  const basePath = 'https://api.bf2.top/platform';
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

const basePath = 'https://api.bf2.top';
const gathers = `${basePath}/gathers`;
const matches = `${basePath}/matches`;
const servers = `${basePath}/servers`;
const admin = `${basePath}/admin`;
const v2 = {
  getHealth: () => getJSON(`${basePath}/health`, { signal: AbortSignal.timeout(5000) }),
  getGather: (config: number | string) =>
    getJSON<GetGatherResponse>(`${gathers}/${config}`, {
      cache: 'no-store',
    }),
  getGatherEvents: (config: number | string) =>
    getJSON<Array<StreamEventReply>>(`${gathers}/${config}/events`, {
      cache: 'no-store',
    }),
  getGatherEventsStream: (config: number | string, start: string | undefined) =>
    getEventSource(`${gathers}/${config}/events/stream?start=${start}`),
  postMatch: (body: PostMatchRequestBody) => postJSON<MatchesJoined>(`${matches}`, body),
  getMatches: () => getJSON<Array<LiveMatch>>(`${matches}`),
  getMatch: (matchId: number) => getJSON<LiveMatch>(`${matches}/${matchId}`),
  postMatchStart: (matchId: number) =>
    postJSON<LiveMatch>(`${matches}/${matchId}/start`, {}),
  getMatchServer: (matchId: number) =>
    getJSON<ConnectedLiveServer>(`${matches}/${matchId}/server`),
  postMatchServer: (matchId: number, address: string, force: boolean) =>
    postJSON<ConnectedLiveServer>(`${matches}/${matchId}/server?force=${force}`, {
      address,
    }),
  getServers: () =>
    getJSON<Array<LiveServer>>(`${servers}`, {
      next: { revalidate: 60 },
    }),
  getServersLogs: () => getJSON<ServersLogs>(`${servers}/logs`, { cache: 'no-store' }),
  getServer: (address: string) =>
    getJSON<LiveServer>(`${servers}/${address}`, {
      cache: 'no-store',
    }),
  getServerLog: (address: string) =>
    getJSON<Array<ServerLogEntry>>(`${servers}/${address}/log`, {
      cache: 'no-store',
    }),
  postServerExec: (address: string, body: PostServerExecRequestBody, token: string) =>
    postJSON<PostServerExecResponseBody>(
      `${servers}/${address}/exec`,
      body,
      toBearerRequestInit(token)
    ),
  deleteServer: (address: string) => deleteJSON(`${servers}/${address}`),
  postServerRestart: (address: string, body: PostRestartServerRequestBody) =>
    postWithApiKeyJSON<PostServerExecResponseBody>(`${servers}/${address}/restart`, body),
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
    getJSON<string>(`https://engine.bf2.top/health`, {
      signal: AbortSignal.timeout(5000),
    }),
};
