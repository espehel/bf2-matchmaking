import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseApi, verifySingleResult } from '@bf2-matchmaking/supabase';
import { MatchesJoined, TeamsRow } from '@bf2-matchmaking/types';
import { hasPlayer, isCaptain, isTeamCaptain } from '@bf2-matchmaking/utils';

export function getActions(client: SupabaseClient) {
  const api = getSupabaseApi(client);

  async function getSessionPlayerOrThrow() {
    const { data, error } = await client.auth.getSession();
    if (error) {
      throw error;
    }
    if (!data.session) {
      throw new Error('Not logged in');
    }
    return api.getPlayerByUserId(data.session.user.id).then(verifySingleResult);
  }

  async function getSessionPlayer() {
    const { data, error } = await client.auth.getSession();
    if (error) {
      return { data: null, error };
    }
    if (!data.session) {
      return { data: null, error: { message: 'Not logged in' } };
    }
    return api.getPlayerByUserId(data.session.user.id);
  }
  async function getSessionPlayerTeamIds() {
    const { data: player } = await getSessionPlayer();
    if (!player) {
      return [];
    }
    const { data: teams } = await api.getTeamsByPlayerId(player.id);
    return teams ? teams.map((team) => team.id) : [];
  }
  async function getAdminRoles() {
    const { data, error } = await client.auth.getSession();
    if (data.session) {
      return api.getAdminRoles(data.session.user.id);
    }
    return { data: null, error };
  }

  async function isMatchPlayer(match: MatchesJoined) {
    const { data: player } = await getSessionPlayer();
    if (!player) {
      return false;
    }
    return hasPlayer(player.id)(match);
  }

  async function isMatchOfficer(match: MatchesJoined) {
    const { data: player } = await getSessionPlayer();
    if (!player) {
      return false;
    }

    if (isCaptain(match, player) || isTeamCaptain(match, player)) {
      return true;
    }

    if (!player.user_id) {
      return false;
    }

    const { data: adminRoles } = await api.getAdminRoles(player.user_id);
    return adminRoles?.match_admin || false;
  }

  async function isTeamPlayerOfficer(...teams: Array<number>) {
    const { data: player } = await getSessionPlayer();
    if (!player) {
      return false;
    }
    const { data } = await api.getTeamPlayersByPlayerId(player.id);
    const teamPlayers =
      data && teams.length ? data.filter((t) => teams.includes(t.team_id)) : data || [];
    if (teamPlayers.some((tp) => tp.captain)) {
      return true;
    }

    if (!player.user_id) {
      return false;
    }
    const { data: adminRoles } = await api.getAdminRoles(player.user_id);

    return adminRoles?.player_admin || false;
  }

  return {
    ...api,
    getSessionPlayer,
    getSessionPlayerOrThrow,
    getSessionPlayerTeamIds,
    getAdminRoles,
    isMatchOfficer,
    isMatchPlayer,
    isTeamPlayerOfficer,
  };
}
