import {
  DiscordConfig,
  MatchesInsert,
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
import { DateTime } from 'luxon';
import { getDiff } from 'recursive-diff';

export const Match = {
  create: async function (values: MatchesInsert) {
    const match = await client().createMatch(values).then(verifySingleResult);
    const redisResult = await putMatch(match);

    logMessage(`Match ${match.id}: Created with status ${match.status}`, {
      match,
      values,
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
  updateMatchPlayers: Array<MatchPlayersInsert> | null = null;
  matchId: number;

  constructor(matchId: number | string) {
    this.matchId = typeof matchId === 'string' ? Number(matchId) : matchId;
  }
  setMaps(maps: Array<number> | null) {
    this.maps = maps;
    return this;
  }
  setTeams(players: Array<MatchPlayersInsert> | null) {
    this.teams = players;
    return this;
  }
  updateTeams(players: Array<MatchPlayersInsert>) {
    this.updateMatchPlayers = players;
    return this;
  }
  async commit(values?: MatchesUpdate) {
    const maps = await this.#createMatchMaps();
    const teams = await this.#createMatchPlayers();
    const updatedPlayers = await this.#upsertMatchPlayers();

    const updatedMatch = values
      ? await client().updateMatch(this.matchId, values).then(verifySingleResult)
      : await client().getMatch(this.matchId).then(verifySingleResult);

    const redisResult = await putMatch(updatedMatch);

    logMessage(`Match ${this.matchId}: Updated with status ${updatedMatch.status}`, {
      values,
      maps,
      teams,
      updatedPlayers,
      updatedMatch,
      redisResult,
    });

    return updatedMatch;
  }

  async #createMatchPlayers() {
    if (!this.teams || this.teams.length === 0) {
      return null;
    }
    info('createMatchPlayers', `Creating match players`);
    await client().deleteAllMatchPlayersForMatchId(this.matchId);
    return client().createMatchPlayers(this.teams).then(verifyResult);
  }

  async #upsertMatchPlayers() {
    if (!this.updateMatchPlayers || this.updateMatchPlayers.length === 0) {
      return null;
    }
    info('updateMatchPlayers', `Updating match players`);
    return client().upsertMatchPlayers(this.updateMatchPlayers).then(verifyResult);
  }

  async #createMatchMaps() {
    if (!this.maps || this.maps.length === 0) {
      return null;
    }
    info('createMatchMaps', `Creating match maps`);
    return client()
      .createMatchMaps(this.matchId, ...this.maps)
      .then(verifyResult);
  }
}
