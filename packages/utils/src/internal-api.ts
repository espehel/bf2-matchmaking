import { MatchConfigEvent, MatchEvent } from '@bf2-matchmaking/types';

export const bot = () => {
  const basePath = 'https://bot.bf2-matchmaking-production.up.railway.app';
  return {
    postMatchEvent: async (matchId: number, event: MatchEvent) => {
      const headers = {
        'Content-Type': 'application/json',
      };
      try {
        const res = await fetch(`${basePath}/api/match_events`, {
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
        const res = await fetch(`${basePath}/api/match_config_events`, {
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
