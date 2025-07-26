import { ResolvableSupabaseClient, resolveClient } from '../index';
import { warn } from '@bf2-matchmaking/logging';

export function session(supabaseClient: ResolvableSupabaseClient) {
  async function getSession() {
    const client = await resolveClient(supabaseClient);
    const { data, error } = await client.auth.getSession();
    if (error) {
      warn('getSession', error.message);
      return null;
    }
    return data.session;
  }
  async function getSessionPlayer() {
    const client = await resolveClient(supabaseClient);
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error) {
      warn('getSession', error.message);
      return null;
    }
    if (!user) {
      return null;
    }
    const { data } = await client
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .single();
    return data;
  }
  return {
    getSession,
    getSessionPlayer,
  };
}
