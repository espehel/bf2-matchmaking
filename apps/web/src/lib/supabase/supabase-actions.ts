import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseApi } from '@bf2-matchmaking/supabase';
import { MatchesJoined } from '@bf2-matchmaking/types';
import { isCaptain, isTeamCaptain } from '@bf2-matchmaking/utils';

export function getActions(client: SupabaseClient) {
  const api = getSupabaseApi(client);
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
  async function getAdminRoles() {
    const { data, error } = await client.auth.getSession();
    if (data.session) {
      return api.getAdminRoles(data.session.user.id);
    }
    return { data: null, error };
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

  async function isTeamOfficer() {
    const { data: player } = await getSessionPlayer();
    if (!player) {
      return false;
    }
    const { data: teamPlayers } = await api.getTeamPlayersByPlayerId(player.id);
    if (teamPlayers && teamPlayers.some((tp) => tp.captain)) {
      return true;
    }

    if (!player.user_id) {
      return false;
    }
    const { data: adminRoles } = await api.getAdminRoles(player.user_id);

    return adminRoles?.match_admin || false;
  }

  return { ...api, getSessionPlayer, getAdminRoles, isMatchOfficer, isTeamOfficer };
}
