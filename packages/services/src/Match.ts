import {
  DiscordConfig,
  MatchesUpdate,
  MatchPlayersInsert,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { info, logMessage, warn } from '@bf2-matchmaking/logging';
import {
  cleanUpPubobotMatch,
  getMatch,
  putMatch,
  removeMatch,
} from '@bf2-matchmaking/redis/matches';
import { json } from '@bf2-matchmaking/redis/json';
import { DateTime } from 'luxon';
import { getDiff } from 'recursive-diff';

export const Match = {
  create: async function (config: DiscordConfig, status: MatchStatus) {
    const match = await client()
      .createMatchFromConfig(config.id, {
        status,
      })
      .then(verifySingleResult);
    const redisResult = await putMatch(match);

    logMessage(`Match ${match.id}: Created with status ${match.status}`, {
      match,
      config,
      redisResult,
    });

    return match;
  },
  get: async function (matchId: number | string) {
    const match = await getMatch(matchId);
    if (match) {
      return match;
    }

    warn('Match', `Match ${matchId} not found in redis, fetching from supabase`);
    return client().getMatch(Number(matchId)).then(verifySingleResult);
  },
  update: function (matchId: number | string) {
    return new MatchUpdater(matchId);
  },
  remove: async function (
    matchId: number | string,
    status: MatchStatus.Closed | MatchStatus.Deleted
  ) {
    const removedMatch = await client()
      .updateMatch(matchId, { status, closed_at: DateTime.now().toISO() })
      .then(verifySingleResult);
    const redisResult = await removeMatch(matchId);
    const deletedPubobotMatch = await cleanUpPubobotMatch(matchId);

    logMessage(`Match ${matchId}: Removed with status ${removedMatch.status}`, {
      removedMatch,
      redisResult,
      deletedPubobotMatch,
    });
    return removedMatch;
  },
  sync: async function (matchId: number | string) {
    const oldMatch = await getMatch(matchId);
    const syncedMatch = await client().getMatch(Number(matchId)).then(verifySingleResult);
    const redisResult = await putMatch(syncedMatch);
    const diff = getDiff(oldMatch, syncedMatch);
    logMessage(`Match ${matchId}: Synced`, { oldMatch, syncedMatch, diff, redisResult });
    return syncedMatch;
  },
};

class MatchUpdater {
  maps: Array<number> | null = null;
  teams: Array<MatchPlayersInsert> | null = null;
  matchId: number;

  constructor(matchId: number | string) {
    this.matchId = typeof matchId === 'string' ? Number(matchId) : matchId;
  }
  setMaps(maps: Array<number>) {
    this.maps = maps;
    return this;
  }
  setTeams(players: Array<MatchPlayersInsert>) {
    this.teams = players;
    return this;
  }
  async commit(values?: MatchesUpdate) {
    const maps = await this.createMatchMaps();
    const teams = await this.createMatchPlayers();

    const updatedMatch = values
      ? await client().updateMatch(this.matchId, values).then(verifySingleResult)
      : await client().getMatch(this.matchId).then(verifySingleResult);

    const redisResult = await putMatch(updatedMatch);

    logMessage(`Match ${this.matchId}: Updated with status ${updatedMatch.status}`, {
      values,
      maps,
      teams,
      updatedMatch,
      redisResult,
    });

    return updatedMatch;
  }

  async createMatchPlayers() {
    if (!this.teams) {
      return null;
    }
    info('createMatchPlayers', `Creating match players`);
    await client().deleteAllMatchPlayersForMatchId(this.matchId);
    return client().createMatchPlayers(this.teams).then(verifyResult);
  }

  async createMatchMaps() {
    if (!this.maps) {
      return null;
    }
    info('createMatchMaps', `Creating match maps`);
    return client()
      .createMatchMaps(this.matchId, ...this.maps)
      .then(verifyResult);
  }
}
