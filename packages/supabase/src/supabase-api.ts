import { SupabaseClient } from '@supabase/supabase-js';
import matches from './matches-api';
import {
  Database,
  MatchConfigsJoined,
  PlayersInsert,
  RoundsJoined,
  ServersJoined,
} from '@bf2-matchmaking/types';

export default (client: SupabaseClient<Database>) => ({
  ...matches(client),
  getPlayerByUserId: (userId?: string) =>
    client.from('players').select('*').eq('user_id', userId).single(),
  getPlayer: (playerId: string | undefined) =>
    client.from('players').select('*').eq('id', playerId).single(),
  createPlayer: (player: PlayersInsert) =>
    client.from('players').insert([player]).select().single(),
  getRounds: () =>
    client
      .from('rounds')
      .select<'*, map(*), server(*)', RoundsJoined>('*, map(*), server(*)'),
  getServers: () =>
    client
      .from('servers')
      .select<'*, matches(id, status)', ServersJoined>('*, matches(id, status)')
      .or('status.eq.picking,status.eq.started', { foreignTable: 'matches' }),
  getServerRoundsByTimestampRange: (
    serverIp: string,
    timestampFrom: string,
    timestampTo: string
  ) =>
    client
      .from('rounds')
      .select<'*, map(*), server(*)', RoundsJoined>('*, map(*), server(*)')
      .gt('created_at', timestampFrom)
      .lt('created_at', timestampTo)
      .eq('server.ip', serverIp),
  getChannels: () => client.from('discord_channels').select('*'),
  getMatchConfigs: () =>
    client
      .from('match_configs')
      .select<'*, channel(*)', MatchConfigsJoined>('*, channel(*)'),
});
