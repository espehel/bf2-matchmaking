import { PostgrestResponse, SupabaseClient } from '@supabase/supabase-js';
import matches from './matches-api';
import {
  DiscordChannelsWithMatches,
  Database,
  MatchConfigsJoined,
  MatchStatus,
  PlayersInsert,
  RoundsInsert,
  RoundsJoined,
  ServersJoined,
  DiscordChannelsJoined,
  DiscordChannelsRow,
  MatchConfigsRow,
} from '@bf2-matchmaking/types';
import { PostgrestResponseSuccess } from '@supabase/postgrest-js/src/types';

export default (client: SupabaseClient<Database>) => ({
  ...matches(client),
  getPlayerByUserId: (userId?: string) =>
    client.from('players').select('*').eq('user_id', userId).single(),
  getPlayers: () => client.from('players').select('*'),
  getPlayer: (playerId: string | undefined) =>
    client.from('players').select('*').eq('id', playerId).single(),
  createPlayer: (player: PlayersInsert) =>
    client.from('players').insert([player]).select().single(),
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
  getChannels: () =>
    client
      .from('discord_channels')
      .select<'*, match_config(*)', DiscordChannelsJoined>('*, match_config(*)'),
  getChannelsWithStagingMatches: () =>
    client
      .from('discord_channels')
      .select<'*, matches(id, status)', DiscordChannelsWithMatches>(
        '*, matches(id, status)'
      )
      .or(
        `status.eq.${MatchStatus.Open},status.eq.${MatchStatus.Drafting},status.eq.${MatchStatus.Ongoing}`,
        {
          foreignTable: 'matches',
        }
      ),
  getActiveMatchConfigs: () =>
    client.from('match_configs').select('*').eq('active', true),
  getMatchConfigByChannelId: (channelId: string) =>
    client.from('match_configs').select('*').eq('channel', channelId).single(),
  getMatchConfigByMatchId: async (matchId: number) => {
    const res = await client
      .from('matches')
      .select('id, channel(match_config(*))')
      .eq('id', matchId)
      .single();
    if (res.error) {
      return res;
    }
    const channel = res.data.channel as DiscordChannelsJoined | null;
    return {
      ...res,
      data: channel?.match_config,
    } as PostgrestResponseSuccess<MatchConfigsRow>;
  },
  getMatchConfigs: () => client.from('match_configs').select('*'),
  createRound: (round: RoundsInsert) =>
    client.from('rounds').insert([round]).select().single(),
  searchMap: (map: string) => client.from('maps').select().textSearch('name', `'${map}'`),
  upsertServer: (ip: string, name: string) =>
    client.from('servers').upsert({ ip, name }).select().single(),
  getMatchAdmins: () => client.from('admin_roles').select('*').eq('match_admin', true),
});
