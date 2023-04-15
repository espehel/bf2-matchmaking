import { MatchConfigEvent, MatchEvent, RconBf2Server } from '@bf2-matchmaking/types';
import { getJSON } from './fetcher';

export const rcon = () => {
  const basePath = 'bf2-rcon-api-production.up.railway.app';
  const paths = {
    servers: () => '/servers',
    server: (ip: string) => `/servers/${ip}`,
  };
  return {
    paths,
    getServers: () => getJSON<Array<RconBf2Server>>(paths.servers()),
    getServer: (ip: string) => getJSON<RconBf2Server>(paths.server(ip)),
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
