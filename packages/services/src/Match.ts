import {
  LogContext,
  MatchDraftsInsert,
  MatchesInsert,
  MatchesUpdate,
  MatchPlayersInsert,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import {
  info,
  logErrorMessage,
  logMessage,
  logWarnMessage,
  warn,
} from '@bf2-matchmaking/logging';
import {
  cleanUpPubobotMatch,
  getMatch,
  putMatch,
  removeMatch,
  setMatchDraft,
} from '@bf2-matchmaking/redis/matches';
import { DateTime } from 'luxon';
import { getDiff } from 'recursive-diff';
import { stream } from '@bf2-matchmaking/redis/stream';
import { topic } from '@bf2-matchmaking/redis/topic';
import { MatchdraftsRow } from '@bf2-matchmaking/schemas/types';

function logMatchMessage(
  matchId: string | number,
  message: string,
  context?: LogContext
) {
  logMessage(`Match ${matchId}: ${message}`, context);
  stream(`matches:${matchId}:log`)
    .log(message, 'info')
    .catch((e) =>
      logErrorMessage(`Match ${matchId}: Error logging match message`, e, context)
    );
}

export const Match = {
  create: async function (values: MatchesInsert) {
    const match = await client().createMatch(values).then(verifySingleResult);
    const redisResult = await putMatch(match);

    logMatchMessage(match.id, `Match ${match.status}`, {
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
      .updateMatch(Number(matchId), { status, closed_at: DateTime.now().toISO() })
      .then(verifySingleResult);
    const redisResult = await removeMatch(matchId);
    const deletedPubobotMatch = await cleanUpPubobotMatch(matchId);

    logMatchMessage(matchId, `Match ${removedMatch.status}`, {
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
    logMatchMessage(matchId, `Synced`, { oldMatch, syncedMatch, diff, redisResult });
    return syncedMatch;
  },
  log: logMatchMessage,
};

class MatchUpdater {
  #maps: Array<number> | null = null;
  #teams: Array<MatchPlayersInsert> | null = null;
  #servers: Array<string> | null = null;
  #updateMatchPlayers: Array<MatchPlayersInsert> | null = null;
  #draft: MatchDraftsInsert | null = null;
  #matchId: number;
  #playersToRemove: Array<string> | null = null;

  constructor(matchId: number | string) {
    this.#matchId = typeof matchId === 'string' ? Number(matchId) : matchId;
  }
  setMaps(maps: Array<number> | null) {
    this.#maps = maps;
    return this;
  }
  setServers(servers: Array<string> | null) {
    this.#servers = servers;
    return this;
  }
  setTeams(players: Array<MatchPlayersInsert> | null) {
    this.#teams = players;
    return this;
  }
  updateTeams(...players: Array<MatchPlayersInsert>) {
    this.#updateMatchPlayers = players;
    return this;
  }
  removePlayers(...playersToRemove: Array<string>) {
    this.#playersToRemove = playersToRemove;
    return this;
  }
  setDraft(values: MatchDraftsInsert | null) {
    this.#draft = { ...values, match_id: this.#matchId };
    return this;
  }
  async commit(values?: MatchesUpdate) {
    const maps = await this.#createMatchMaps();
    const servers = await this.#createMatchServers();
    const teams = await this.#createMatchPlayers();
    const updatedPlayers = await this.#upsertMatchPlayers();
    const draft = await this.#createMatchDraft();
    const removedPlayers = await this.removeMatchPlayers();

    const updatedMatch = values
      ? await client().updateMatch(this.#matchId, values).then(verifySingleResult)
      : await client().getMatch(this.#matchId).then(verifySingleResult);

    const redisResult = await putMatch(updatedMatch);
    if (values) {
      logMessage(`Match ${this.#matchId}: Updated with status ${updatedMatch.status}`, {
        values,
        draft,
        maps,
        servers,
        teams,
        updatedPlayers,
        updatedMatch,
        redisResult,
        removedPlayers,
      });
    }

    return updatedMatch;
  }

  async #createMatchPlayers() {
    if (!this.#teams || this.#teams.length === 0) {
      return null;
    }
    info('createMatchPlayers', `Creating match players`);
    await client().deleteAllMatchPlayersForMatchId(this.#matchId);
    return client().createMatchPlayers(this.#teams).then(verifyResult);
  }

  async #upsertMatchPlayers() {
    if (!this.#updateMatchPlayers || this.#updateMatchPlayers.length === 0) {
      return null;
    }
    info('updateMatchPlayers', `Updating match players`);
    return client().upsertMatchPlayers(this.#updateMatchPlayers).then(verifyResult);
  }

  async #createMatchMaps() {
    if (!this.#maps || this.#maps.length === 0) {
      return null;
    }
    info('createMatchMaps', `Creating match maps`);
    return client()
      .createMatchMaps(this.#matchId, ...this.#maps)
      .then(verifyResult);
  }
  async #createMatchServers() {
    if (!this.#servers || this.#servers.length === 0) {
      return null;
    }
    info('createMatchServers', `Creating match servers`);
    return client()
      .createMatchServers(this.#matchId, ...this.#servers.map((server) => ({ server })))
      .then(verifyResult);
  }
  async #createMatchDraft() {
    if (!this.#draft) {
      return null;
    }
    info('createMatchDraft', `Creating match draft`);
    const draft = await client().matchDrafts.create(this.#draft).then(verifySingleResult);

    const redisResult = await setMatchDraft(draft);
    if (redisResult === 'OK') {
      return await topic(`matchDrafts`).publish<MatchdraftsRow>(draft);
    }
    logWarnMessage(`Match ${this.#matchId}: Failed to set match draft in Redis`, {
      draft,
    });

    return draft;
  }
  async removeMatchPlayers() {
    if (!this.#playersToRemove) {
      return null;
    }
    info('removeMatchPlayers', `Removing match players`);
    return await client()
      .matches.players.remove(this.#matchId, ...this.#playersToRemove)
      .then(verifyResult);
  }
}
