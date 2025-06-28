import {
  PostServerExecRequestBody,
  PostServerExecResponseBody,
  LiveMatch,
  PostRestartServerRequestBody,
  MatchesJoined,
  GetGatherResponse,
} from '@bf2-matchmaking/types';
import {
  deleteJSON,
  getEventSource,
  getJSON,
  postJSON,
  postWithApiKeyJSON,
  toBearerRequestInit,
} from '@bf2-matchmaking/utils';
import {
  ConnectedLiveServer,
  LiveServer,
  ServerLogEntry,
  ServersLogs,
} from '@bf2-matchmaking/types/server';
import { StreamEventReply } from '@bf2-matchmaking/types/redis';
import { GetMatchLogsResponse, MatchesPostRequestBody } from './schemas/matches';

//const basePath = 'http://localhost:5004';
const basePath = 'https://api.bf2.top';
const gathers = `${basePath}/gathers`;
const matches = `${basePath}/matches`;
const servers = `${basePath}/servers`;
const admin = `${basePath}/admin`;
export const api = {
  getHealth: () => getJSON(`${basePath}/health`, { signal: AbortSignal.timeout(5000) }),
  getGather: (config: number | string) =>
    getJSON<GetGatherResponse>(`${gathers}/${config}`, {
      cache: 'no-store',
    }),
  postGatherServer: (config: number | string, address: string) =>
    postJSON<number>(`${gathers}/${config}/server`, {
      address,
    }),
  getGatherEvents: (config: number | string) =>
    getJSON<Array<StreamEventReply>>(`${gathers}/${config}/events`, {
      cache: 'no-store',
    }),
  getGatherEventsStream: (config: number | string, start: string | undefined) =>
    getEventSource(`${gathers}/${config}/events/stream?start=${start}`),
  postMatches: (body: MatchesPostRequestBody) =>
    postJSON<MatchesJoined>(`${matches}`, body),
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
  getMatchLog: (matchId: number) =>
    getJSON<GetMatchLogsResponse>(`${matches}/${matchId}/log`, { cache: 'no-store' }),
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
  postServerPause: (address: string, token: string) =>
    postJSON(`${servers}/${address}/pause`, {}, toBearerRequestInit(token)),
  postServerUnpause: (address: string, token: string) =>
    postJSON(`${servers}/${address}/unpause`, {}, toBearerRequestInit(token)),
  postServerMaps: (address: string, map: number, token: string) =>
    postJSON(`${servers}/${address}/maps`, { map }, toBearerRequestInit(token)),
  deleteServer: (address: string, token: string) =>
    deleteJSON(`${servers}/${address}`, toBearerRequestInit(token)),
  postServerRestart: (address: string, body: PostRestartServerRequestBody) =>
    postWithApiKeyJSON<PostServerExecResponseBody>(`${servers}/${address}/restart`, body),
  adminReset: () => postWithApiKeyJSON(`${admin}/reset`, {}),
  adminResetEngine: () => postWithApiKeyJSON(`${admin}/reset/engine`, {}),
  adminResetServers: () => postWithApiKeyJSON(`${admin}/reset/servers`, {}),
};

export const engine = {
  getHealth: () =>
    getJSON<string>(`https://engine.bf2.top/health`, {
      signal: AbortSignal.timeout(5000),
    }),
};
