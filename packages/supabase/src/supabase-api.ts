import { PostgrestResponse, SupabaseClient } from '@supabase/supabase-js';
import matches from './matches-api';
import {
  Database,
  DiscordConfig,
  MatchConfigModeType,
  MatchConfigsRow,
  MatchStatus,
  PlayersInsert,
  PlayersUpdate,
  RoundsInsert,
  RoundsJoined,
  ServerRconsRow,
  ServersJoined,
  ServersRow,
} from '@bf2-matchmaking/types';
import { PostgrestSingleResponse } from '@supabase/postgrest-js/src/types';

export default (client: SupabaseClient<Database>) => ({
  ...matches(client),
  getServerRcon: (ip: string) =>
    client.from('server_rcons').select('*').eq('id', ip).single(),
  getPlayerByUserId: (userId?: string) =>
    client.from('players').select('*').eq('user_id', userId).single(),
  getPlayers: () => client.from('players').select('*'),
  getPlayer: (playerId: string | undefined) =>
    client.from('players').select('*').eq('id', playerId).single(),
  createPlayer: (player: PlayersInsert) =>
    client.from('players').insert([player]).select().single(),
  updatePlayer: (playerId: string, values: PlayersUpdate) =>
    client.from('players').update(values).eq('id', playerId).select('*').single(),
  getRound: (id: number) =>
    client
      .from('rounds')
      .select<'*, map(*), server(*)', RoundsJoined>('*, map(*), server(*)')
      .eq('id', id)
      .single(),
  getRounds: (limit?: number) =>
    client
      .from('rounds')
      .select<'*, map(*), server(*)', RoundsJoined>('*, map(*), server(*)')
      .order('id', { ascending: false })
      .limit(limit || 50),
  getServers: () =>
    client
      .from('servers')
      .select<'*, matches(id, status)', ServersJoined>('*, matches(id, status)')
      .or(`status.eq.${MatchStatus.Drafting},status.eq.${MatchStatus.Ongoing}`, {
        foreignTable: 'matches',
      }),
  getServer: (ip: string) =>
    client
      .from('servers')
      .select<'*, matches(id, status)', ServersJoined>('*, matches(id, status)')
      .eq('ip', ip)
      .single(),
  getServerByNameSearch: (name: string) =>
    client.from('servers').select('*').textSearch('name', name, {
      type: 'websearch',
      config: 'english',
    }),
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
  getActiveMatchConfigs: () =>
    client
      .from('match_configs')
      .select<'*', MatchConfigsRow>('*')
      .eq('mode', MatchConfigModeType.Active),
  getMatchConfigByChannelId: (channelId: string) =>
    client
      .from('match_configs')
      .select<'*', DiscordConfig>('*')
      .eq('channel', channelId)
      .single(),
  getMatchConfigs: () => client.from('match_configs').select<'*', MatchConfigsRow>('*'),
  createRound: (round: RoundsInsert) =>
    client.from('rounds').insert([round]).select().single(),
  searchMap: (map: string) => client.from('maps').select().textSearch('name', `'${map}'`),
  upsertServer: (ip: string, name: string) =>
    client.from('servers').upsert({ ip, name }).select().single(),
  getMatchAdmins: () => client.from('admin_roles').select('*').eq('match_admin', true),
});
