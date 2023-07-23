import {
  MatchConfigEvent,
  MatchEvent,
  PostMatchesRequestBody,
  PostMatchResult,
  RconBf2Server,
} from '@bf2-matchmaking/types';
import { getJSON, postJSON } from './fetcher';

export const rcon = () => {
  const basePath = 'http://localhost:5002'; //'https://bf2-rcon-api-production.up.railway.app';
  const paths = {
    servers: () => '/servers',
    server: (ip: string) => `/servers/${ip}`,
    matches: () => '/matches',
  };
  return {
    paths,
    getServers: () => getJSON<Array<RconBf2Server>>(basePath.concat(paths.servers())),
    getServer: (ip: string) => getJSON<RconBf2Server>(basePath.concat(paths.server(ip))),
    postMatch: (body: PostMatchesRequestBody) =>
      postJSON<PostMatchResult>(basePath.concat(paths.matches()), body),
  };
};
export const bot = () => {
  const basePath = 'https://bot.bf2-matchmaking-production.up.railway.app';
  const paths = {
    matchEvent: '/api/match_events',
    matchConfigEvent: '/api/match_config_events',
  };
  return {
    paths,
    postMatchEvent: async (matchId: number, event: MatchEvent) => {
      const headers = {
        'Content-Type': 'application/json',
      };
      try {
        const res = await fetch(`${basePath}${paths.matchEvent}`, {
          headers,
          method: 'POST',
          body: JSON.stringify({ matchId, event }),
        });
        if (res.ok) {
          return { data: res, error: null };
        } else {
          const error = await res.text();
          return { data: null, error };
        }
      } catch (error) {
        return { data: null, error };
      }
    },
    postMatchConfigEvent: async (channelId: string, event: MatchConfigEvent) => {
      const headers = {
        'Content-Type': 'application/json',
      };
      try {
        const res = await fetch(`${basePath}${paths.matchConfigEvent}`, {
          headers,
          method: 'POST',
          body: JSON.stringify({ channelId, event }),
        });
        if (res.ok) {
          return { data: res, error: null };
        } else {
          const error = await res.text();
          return { data: null, error };
        }
      } catch (error) {
        return { data: null, error };
      }
    },
  };
};
