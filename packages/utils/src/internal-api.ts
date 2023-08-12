import {
  PostRconRequestBody,
  MatchConfigEvent,
  MatchEvent,
  PlayerListItem,
  PostMatchesRequestBody,
  PostMatchResult,
  RconBf2Server,
  ServerInfo,
  PostServerExecRequestBody,
} from '@bf2-matchmaking/types';
import { getJSON, postJSON } from './fetcher';

export const rcon = () => {
  const basePath = 'https://bf2-rcon-api-production.up.railway.app';
  const paths = {
    rconServerInfo: () => '/rcon/si',
    rconPlayerList: () => '/rcon/pl',
    servers: () => '/servers',
    server: (ip: string) => `/servers/${ip}`,
    serverInfo: (ip: string) => `/servers/${ip}/si`,
    serverPlayerList: (ip: string) => `/servers/${ip}/pl`,
    serverExec: (ip: string) => `/servers/${ip}/exec`,
    serverPause: (ip: string) => `/servers/${ip}/pause`,
    serverUnpause: (ip: string) => `/servers/${ip}/unpause`,
    matches: () => '/matches',
    rconServerPlayer: (serverIp: string, playerId: string) =>
      `/rcon/${serverIp}/${playerId}`,
  };
  return {
    paths,
    postRconServerInfo: (body: PostRconRequestBody) =>
      postJSON<ServerInfo>(basePath.concat(paths.rconServerInfo()), body),
    postRconPlayerList: (body: PostRconRequestBody) =>
      postJSON<ServerInfo>(basePath.concat(paths.rconPlayerList()), body),
    getServerInfo: (ip: string) =>
      getJSON<ServerInfo>(basePath.concat(paths.serverInfo(ip))),
    postServerExec: (ip: string, body: PostServerExecRequestBody) =>
      postJSON(basePath.concat(paths.serverExec(ip)), body),
    postServerPause: (ip: string) => postJSON(basePath.concat(paths.serverInfo(ip)), {}),
    postServerUnpause: (ip: string) =>
      postJSON(basePath.concat(paths.serverInfo(ip)), {}),
    getServerPlayerList: (ip: string) =>
      getJSON<Array<PlayerListItem>>(basePath.concat(paths.serverPlayerList(ip))),
    getServers: () => getJSON<Array<RconBf2Server>>(basePath.concat(paths.servers())),
    getServer: (ip: string) => getJSON<RconBf2Server>(basePath.concat(paths.server(ip))),
    postMatch: (body: PostMatchesRequestBody) =>
      postJSON<PostMatchResult>(basePath.concat(paths.matches()), body),
    getRconServerPlayer: (serverIp: string, playerId: string) =>
      getJSON<PlayerListItem>(
        basePath.concat(paths.rconServerPlayer(serverIp, playerId))
      ),
  };
};
export const bot = () => {
  const basePath = 'https://bot.bf2-matchmaking-production.up.railway.app';
  const paths = {
    matchEvent: '/api/match_events',
    matchConfigEvent: '/api/match_config_events',
    commandsReinstall: '/commands/reinstall',
    matches: '/matches',
  };
  return {
    paths,
    postMatchEvent: (matchId: number, event: MatchEvent) =>
      postJSON(basePath.concat(paths.matchEvent), event),
    postMatchConfigEvent: (channelId: string, event: MatchConfigEvent) =>
      postJSON(basePath.concat(paths.matchConfigEvent), event),
  };
};
