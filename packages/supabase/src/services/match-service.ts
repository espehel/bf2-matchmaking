import {
  MatchConfigsJoined,
  MatchConfigsRow,
  MatchesJoined,
  QuickMatch,
  RoundsJoined,
} from '@bf2-matchmaking/types';
import supabaseApi from '../supabase-api';
import { verifyResult, verifySingleResult } from '../index';

export default (api: ReturnType<typeof supabaseApi>) => ({
  getMatchRounds: async (match: MatchesJoined) => {
    if (!match.server) {
      return null;
    }
    if (!match.started_at) {
      return null;
    }

    const closedAt = match.closed_at || new Date().toISOString();
    const { data, error } = await api.getServerRoundsByTimestampRange(
      match.server.ip,
      match.started_at,
      closedAt
    );
    if (error) {
      console.log(error);
      return null;
    }
    return data as Array<RoundsJoined>;
  },
  getQuickMatchFromConfig: async (config: MatchConfigsJoined): Promise<QuickMatch> => {
    const openMatches = await api
      .getStagingMatchesByChannel(config.channel.id)
      .then(verifyResult);
    const match = openMatches.at(0);

    if (!match) {
      const { draft, size, channel, map_draft } = config;
      const { data: newMatch } = await api.createMatch({
        pick: draft,
        size,
        channel: channel.id,
        map_draft,
      });
      return [config, newMatch];
    }

    if (openMatches.length > 1) {
      console.log('Multiple open matches for the same channel exists.');
    }

    return [config, match];
  },
  createMatchFromConfig: async (config: MatchConfigsRow) => {
    const { draft, size, channel, map_draft } = config;
    return await api
      .createMatch({
        pick: draft,
        size,
        channel,
        map_draft,
      })
      .then(verifySingleResult);
  },
});
