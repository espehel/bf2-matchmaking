import {
  PostRconRequestBody,
  PlayerListItem,
  RconBf2Server,
  ServerInfo,
  PostServerExecRequestBody,
  PostServerExecResponseBody,
  PostServerPlayersSwitchRequestBody,
  GetMatchLiveResponseBody,
  LiveInfo,
  DnsRecordWithoutPriority,
  Region,
  PostDemosRequestBody,
  PostDemosResponseBody,
} from '@bf2-matchmaking/types';
import { deleteJSON, getJSON, postJSON } from './fetcher';
import { Instance } from '@bf2-matchmaking/types/src/vultr';

const web = () => {
  const basePath = 'https://bf2.gg';
  return {
    basePath,
    matchPage: (matchId: number | string, playerId?: string) =>
      `${basePath}/matches/${matchId}${playerId ? `?player=${playerId}` : ''}`,
  };
};
const rcon = () => {
  const basePath = 'https://rcon.bf2.gg';
  const paths = {
    rconServers: () => '/rcon/servers',
    rconServerInfo: () => '/rcon/si',
    rconPlayerList: () => '/rcon/pl',
    servers: () => '/servers',
    server: (ip: string) => `/servers/${ip}`,
    serverLive: (ip: string) => `/servers/${ip}/live`,
    serverInfo: (ip: string) => `/servers/${ip}/si`,
    serverPlayerList: (ip: string) => `/servers/${ip}/pl`,
    serverExec: (ip: string) => `/servers/${ip}/exec`,
    serverPause: (ip: string) => `/servers/${ip}/pause`,
    serverUnpause: (ip: string) => `/servers/${ip}/unpause`,
    serverPlayersSwitch: (ip: string) => `/servers/${ip}/players/switch`,
    serverMaps: (ip: string) => `/servers/${ip}/maps`,
    matches: () => '/matches',
    matchesLive: () => '/matches/live',
    matchLive: (matchId: number) => `/matches/${matchId}/live`,
    matchResults: (matchId: number) => `/matches/${matchId}/results`,
    rconServerPlayer: (serverIp: string, playerId: string) =>
      `/rcon/${serverIp}/${playerId}`,
  };
  return {
    paths,
    getRconServers: () =>
      getJSON<Array<LiveInfo>>(basePath.concat(paths.rconServers()), {
        cache: 'no-store',
      }),
    postRconServerInfo: (body: PostRconRequestBody) =>
      postJSON<ServerInfo>(basePath.concat(paths.rconServerInfo()), body),
    postRconPlayerList: (body: PostRconRequestBody) =>
      postJSON<ServerInfo>(basePath.concat(paths.rconPlayerList()), body),
    getServerInfo: (ip: string) =>
      getJSON<ServerInfo>(basePath.concat(paths.serverInfo(ip)), { cache: 'no-store' }),
    postServerExec: (ip: string, body: PostServerExecRequestBody) =>
      postJSON<PostServerExecResponseBody>(basePath.concat(paths.serverExec(ip)), body),
    postServerPause: (ip: string) => postJSON(basePath.concat(paths.serverPause(ip)), {}),
    postServerMaps: (ip: string, map: number) =>
      postJSON(basePath.concat(paths.serverMaps(ip)), { map }),
    postServerUnpause: (ip: string) =>
      postJSON(basePath.concat(paths.serverUnpause(ip)), {}),
    postServerPlayersSwitch: (ip: string, body: PostServerPlayersSwitchRequestBody) =>
      postJSON(basePath.concat(paths.serverPlayersSwitch(ip)), body),
    getServerPlayerList: (ip: string) =>
      getJSON<Array<PlayerListItem>>(basePath.concat(paths.serverPlayerList(ip)), {
        next: { tags: ['getServerPlayerList'] },
      }),
    getServers: () =>
      getJSON<Array<RconBf2Server>>(basePath.concat(paths.servers()), {
        cache: 'no-store',
      }),
    getServer: (ip: string) =>
      getJSON<RconBf2Server>(basePath.concat(paths.server(ip)), {
        cache: 'no-store',
      }),
    deleteServerLive: (ip: string) =>
      deleteJSON<RconBf2Server>(basePath.concat(paths.serverLive(ip))),
    postMatchLive: (matchId: number, prelive: boolean) =>
      postJSON(`${basePath}${paths.matchLive(matchId)}?prelive=${prelive}`, {}),
    getMatchesLive: () =>
      getJSON<Array<GetMatchLiveResponseBody>>(basePath.concat(paths.matchesLive())),
    getMatchLive: (matchId: number) =>
      getJSON<GetMatchLiveResponseBody>(basePath.concat(paths.matchLive(matchId))),
    postMatchResults: (matchId: number) =>
      postJSON(basePath.concat(paths.matchResults(matchId)), {}),
    getRconServerPlayer: (serverIp: string, playerId: string) =>
      getJSON<PlayerListItem>(
        basePath.concat(paths.rconServerPlayer(serverIp, playerId))
      ),
  };
};
const bot = () => {
  const basePath = 'https://bot.bf2.gg';
  const paths = {
    channelsListeners: (channelId: string) => `/matches/${channelId}/listeners`,
    demos: () => `/demos`,
  };
  return {
    paths,
    postChannelsListeners: (channelId: string) =>
      postJSON(basePath.concat(paths.channelsListeners(channelId)), {}),
    deleteChannelsListeners: (channelId: string) =>
      postJSON(basePath.concat(paths.channelsListeners(channelId)), {}),
    postDemos: (body: PostDemosRequestBody) =>
      postJSON<PostDemosResponseBody>(basePath.concat(paths.demos()), body),
  };
};

const engine = () => {
  const basePath = 'https://engine.bf2.gg';
  const paths = {
    matchUsersXml: (matchId: number | string) => `/matches/${matchId}/users.xml`,
  };
  return {
    paths,
    getMatchUsersXml: (matchId: number | string) =>
      getJSON<string>(basePath.concat(paths.matchUsersXml(matchId))),
  };
};

const platform = () => {
  const basePath = 'https://platform.bf2.gg';
  const paths = {
    servers: () => '/servers',
    server: (ip: string) => `/servers/${ip}`,
    serverDns: (ip: string) => `/servers/${ip}/dns`,
    locations: () => '/locations',
  };
  return {
    postServers: (
      name: string,
      region: string,
      match: string | number,
      map: string | null,
      vehicles: string | null
    ) =>
      postJSON<Instance>(basePath.concat(paths.servers()), {
        name,
        region,
        match,
        map,
        vehicles,
      }),
    getServer: (ip: string) => getJSON<Instance>(basePath.concat(paths.server(ip))),
    deleteServer: (id: string) => deleteJSON<Instance>(basePath.concat(paths.server(id))),
    getServerDns: (ip: string) =>
      getJSON<DnsRecordWithoutPriority>(basePath.concat(paths.serverDns(ip))),
    getLocations: () => getJSON<Array<Region>>(basePath.concat(paths.locations())),
  };
};

export const api = {
  rcon,
  bot,
  web,
  platform,
  engine,
};
