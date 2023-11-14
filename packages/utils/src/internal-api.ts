import {
  PostRconRequestBody,
  MatchConfigEvent,
  MatchEvent,
  PlayerListItem,
  RconBf2Server,
  ServerInfo,
  PostServerExecRequestBody,
  PostServerExecResponseBody,
  PostServerPlayersSwitchRequestBody,
  GetMatchLiveResponseBody,
  LiveInfo,
} from '@bf2-matchmaking/types';
import { deleteJSON, getJSON, postJSON } from './fetcher';

const web = () => {
  const basePath = 'https://bf2-matchmaking.vercel.app';
  return {
    basePath,
  };
};
const rcon = () => {
  const basePath = 'https://bf2-rcon.up.railway.app';
  const paths = {
    rconServers: () => '/rcon/servers',
    rconServerInfo: () => '/rcon/si',
    rconPlayerList: () => '/rcon/pl',
    servers: () => '/servers',
    server: (ip: string) => `/servers/${ip}`,
    serverInfo: (ip: string) => `/servers/${ip}/si`,
    serverPlayerList: (ip: string) => `/servers/${ip}/pl`,
    serverExec: (ip: string) => `/servers/${ip}/exec`,
    serverPause: (ip: string) => `/servers/${ip}/pause`,
    serverUnpause: (ip: string) => `/servers/${ip}/unpause`,
    serverPlayersSwitch: (ip: string) => `/servers/${ip}/players/switch`,
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
    getServer: (ip: string) => getJSON<RconBf2Server>(basePath.concat(paths.server(ip))),
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
  const basePath = 'https://bf2-bot.up.railway.app';
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

const platform = () => {
  const basePath = 'https://bf2-platform.up.railway.app';
  const paths = {
    servers: '/servers',
  };
  return {
    postServers: (name: string, region: string, label: string) =>
      postJSON(basePath.concat(paths.servers), { name, region, label }),
    deleteServer: (ip: string) => deleteJSON(basePath.concat(paths.servers, ip)),
  };
};

export const api = {
  rcon,
  bot,
  web,
  platform,
};
