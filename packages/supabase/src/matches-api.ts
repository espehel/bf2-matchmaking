import { SupabaseClient } from '@supabase/supabase-js';
import {
  Database,
  MatchConfigsRow,
  MatchesJoined,
  MatchesUpdate,
  MatchPlayersRow,
  MatchStatus,
} from '@bf2-matchmaking/types';

const MATCHES_JOINED_QUERY =
  '*, players(*), maps(*), config!inner(*), teams:match_players(*), server(*)';

export default (client: SupabaseClient<Database>) => ({
  createMatchFromConfig: (config: MatchConfigsRow) =>
    client
      .from('matches')
      .insert([{ config: config.id }])
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .single(),
  getMatches: () => client.from('matches').select('*'),
  getStagingMatchesByChannel: (channel: string) =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .eq('config.channel', channel)
      .or(
        `status.eq.${MatchStatus.Open},status.eq.${MatchStatus.Summoning},status.eq.${MatchStatus.Drafting}`
      ),
  getMatch: (matchId: number | undefined) =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .eq('id', matchId)
      .single(),
  getOpenMatchByChannelId: (channelId: string) =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .eq('config.channel', channelId)
      .or(`status.eq.${MatchStatus.Open}`),
  getDraftingMatchByChannelId: (channelId: string) =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .eq('config.channel', channelId)
      .or(`status.eq.${MatchStatus.Drafting}`)
      .single(),
  getStagingMatchesByConfig: (configId: number) =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .eq('config', configId)
      .or(
        `status.eq.${MatchStatus.Open},status.eq.${MatchStatus.Summoning},status.eq.${MatchStatus.Drafting}`
      ),
  updateMatch: (matchId: number | undefined, values: MatchesUpdate) =>
    client.from('matches').update(values).eq('id', matchId),

  createMatchPlayer: (
    match_id: number,
    player_id: string,
    source: 'web' | 'bot',
    expire_at: string | null
  ) => client.from('match_players').insert([{ match_id, player_id, source, expire_at }]),

  deleteMatchPlayer: (matchId: number, playerId: string) =>
    client
      .from('match_players')
      .delete()
      .eq('match_id', matchId)
      .eq('player_id', playerId),
  deleteMatchPlayers: (matchId: number, players: Array<MatchPlayersRow>) =>
    client
      .from('match_players')
      .delete()
      .eq('match_id', matchId)
      .in(
        'player_id',
        players.map((mp) => mp.player_id)
      ),
  updateMatchPlayer: async (
    matchId: number,
    playerId: string | undefined,
    values: Partial<MatchPlayersRow>
  ) =>
    await client
      .from('match_players')
      .update(values)
      .eq('match_id', matchId)
      .eq('player_id', playerId)
      .select(),
  updateMatchPlayers: async (
    matchId: number,
    players: Array<{ player_id: string }>,
    values: Partial<MatchPlayersRow>
  ) =>
    await client
      .from('match_players')
      .update(values)
      .eq('match_id', matchId)
      .in(
        'player_id',
        players.map((mp) => mp.player_id)
      )
      .select(),

  createMatchMaps: (match_id: number, ...maps: Array<number>) =>
    client.from('match_maps').insert(maps.map((mapId) => ({ match_id, map_id: mapId }))),
  getOngoingMatchesByServer: (serverIp: string) =>
    client
      .from('matches')
      .select('*')
      .eq('status', MatchStatus.Ongoing)
      .eq('server', serverIp),
});
