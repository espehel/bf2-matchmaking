import {
  MatchConfigsRow,
  MatchesJoined,
  QuickMatch,
  RoundsJoined,
  User,
} from '@bf2-matchmaking/types';
import supabaseApi from '../supabase-api';
import { verifyResult, verifySingleResult } from '../index';
import { info } from '@bf2-matchmaking/logging';

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
  getQuickMatchFromConfig: async (config: MatchConfigsRow): Promise<QuickMatch> => {
    const stagingMatches = await api
      .getStagingMatchesByConfig(config.id)
      .then(verifyResult);
    const match = stagingMatches.at(0);

    if (!match) {
      const { data: newMatch } = await api.createMatchFromConfig(config.id);
      return [config, newMatch];
    }

    if (stagingMatches.length > 1) {
      console.log('Multiple open matches for the same channel exists.');
    }

    return [config, match];
  },
  getOrCreatePlayer: async ({ id, username, discriminator, avatar }: User) => {
    const { error, data } = await api.getPlayer(id);
    if (error) {
      info('getOrCreatePlayer', `Inserting Player <${username}> with id ${id}`);
      return api
        .createPlayer({
          id,
          username: `${username}#${discriminator}`,
          full_name: username,
          avatar_url: avatar || '',
        })
        .then(verifySingleResult);
    }
    return data;
  },
});
