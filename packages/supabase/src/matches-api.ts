import { SupabaseClient } from '@supabase/supabase-js';
import {
  Database,
  MatchesInsert,
  MatchesJoined,
  MatchesRow,
  MatchesUpdate,
  MatchPlayerResultsInsert,
  MatchPlayerResultsJoined,
  MatchPlayersInsert,
  MatchPlayersRow,
  MatchResultsInsert,
  MatchResultsJoined,
  MatchServers,
  MatchServerSchedule,
  MatchServersInsert,
  MatchServersUpdate,
  MatchStatus,
  PlayerResultsJoined,
  ServersRow,
} from '@bf2-matchmaking/types';

const MATCHES_JOINED_QUERY =
  '*, players!match_players(*), maps(*), config!inner(*), teams:match_players(*), rounds(*, map(*), team1(*), team2(*)), home_team(*, players:team_players(*, player:players(*))), away_team(*, players:team_players(*, player:players(*)))';
export default (client: SupabaseClient<Database>) => ({
  createMatch: (values: MatchesInsert) =>
    client
      .from('matches')
      .insert(values)
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .single(),
  createMatchFromConfig: (config: number, values?: Omit<MatchesInsert, 'config'>) =>
    client
      .from('matches')
      .insert([{ config, ...values }])
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .single(),
  createScheduledMatch: (
    config: number,
    home_team: number,
    away_team: number,
    scheduled_at: string
  ) =>
    client
      .from('matches')
      .insert([
        {
          status: MatchStatus.Scheduled,
          config,
          home_team,
          away_team,
          scheduled_at,
        },
      ])
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .single(),
  getMatches: () =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY),
  getScheduledMatches: (scheduledAfter: string | null) =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .gte('scheduled_at', scheduledAfter),
  getMatchServerSchedule: (
    scheduledAfter: string | null,
    scheduledBefore: string | null
  ) =>
    client
      .from('matches')
      .select('id, config(*), scheduled_at, servers(*)')
      .gte('scheduled_at', scheduledAfter)
      .lte('scheduled_at', scheduledBefore)
      .returns<Array<MatchServerSchedule>>(),
  getMatchesInIdList: (idList: Array<number>) =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .in('id', idList),
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
  getOpenMatchesByChannelId: (channelId: string) =>
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
  getDraftingMatchesByChannelId: (channelId: string) =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .eq('config.channel', channelId)
      .or(`status.eq.${MatchStatus.Drafting}`),
  getStagingMatches: () =>
    client
      .from('matches')
      .select('*')
      .or(
        `status.eq.${MatchStatus.Open},status.eq.${MatchStatus.Summoning},status.eq.${MatchStatus.Drafting}`
      ),
  getMatchesWithStatus: (...status: Array<MatchStatus>) =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .in('status', status),
  getStagingMatchesByConfig: (configId: number) =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .eq('config', configId)
      .or(
        `status.eq.${MatchStatus.Open},status.eq.${MatchStatus.Summoning},status.eq.${MatchStatus.Drafting}`
      ),
  updateMatch: (matchId: number | string | undefined, values: MatchesUpdate) =>
    client
      .from('matches')
      .update(values)
      .eq('id', matchId)
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .single(),
  updateMatches: async (matches: Array<number>, values: Partial<MatchesUpdate>) =>
    await client.from('matches').update(values).in('id', matches).select(),
  deleteMatch: (matchId: number | undefined) =>
    client.from('matches').delete().eq('id', matchId),
  createMatchPlayer: (
    match_id: number,
    player_id: string,
    values: Partial<MatchPlayersRow>
  ) => client.from('match_players').insert([{ match_id, player_id, ...values }]),
  createMatchPlayers: (players: Array<MatchPlayersInsert>) =>
    client.from('match_players').insert(players).select('*'),
  upsertMatchPlayers: (players: Array<MatchPlayersInsert>) =>
    client.from('match_players').upsert(players).select('*'),
  deleteMatchPlayer: (matchId: number, playerId: string) =>
    client
      .from('match_players')
      .delete()
      .eq('match_id', matchId)
      .eq('player_id', playerId)
      .select('*'),
  deleteMatchPlayersForMatchId: (matchId: number, players: Array<MatchPlayersRow>) =>
    client
      .from('match_players')
      .delete()
      .eq('match_id', matchId)
      .in(
        'player_id',
        players.map((mp) => mp.player_id)
      ),
  deleteAllMatchPlayersForMatchId: (matchId: number) =>
    client.from('match_players').delete().eq('match_id', matchId),
  deleteMatchPlayersForPlayerId: (playerId: string, matches: Array<MatchesRow>) =>
    client
      .from('match_players')
      .delete()
      .eq('player_id', playerId)
      .in(
        'match_id',
        matches.map((m) => m.id)
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
      .select()
      .single(),
  updateMatchPlayersForMatchId: async (
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
  updateMatchPlayersForPlayerId: (
    playerId: string,
    matches: Array<MatchesRow | MatchesJoined>,
    values: Partial<MatchPlayersRow>
  ) =>
    client
      .from('match_players')
      .update(values)
      .eq('player_id', playerId)
      .in(
        'match_id',
        matches.map((m) => m.id)
      ),

  deleteAllMatchMaps: (matchId: number) =>
    client.from('match_maps').delete().eq('match_id', matchId),
  createMatchMaps: (match_id: number, ...maps: Array<number>) =>
    client
      .from('match_maps')
      .insert(maps.map((mapId) => ({ match_id, map_id: mapId })))
      .select('*'),
  createMatchResult: (...results: Array<MatchResultsInsert>) =>
    client
      .from('match_results')
      .insert(results)
      .select<'*, team(*)', MatchResultsJoined>('*, team(*)'),
  createMatchPlayerResults: (...results: Array<MatchPlayerResultsInsert>) =>
    client.from('match_player_results').insert(results).select(),
  getMatchResults: () =>
    client
      .from('match_results')
      .select<'*, team(*)', MatchResultsJoined>('*, team(*)')
      .limit(20),
  getMatchResultsByMatchId: (matchId: number) =>
    client
      .from('match_results')
      .select<'*, team(*)', MatchResultsJoined>('*, team(*)')
      .eq('match_id', matchId),
  getMatchPlayerResultsByMatchId: (matchId: number) =>
    client
      .from('match_player_results')
      .select<'*, player:players(*)', MatchPlayerResultsJoined>('*, player:players(*)')
      .eq('match_id', matchId)
      .order('score', { ascending: false }),
  getMatchPlayerResultsByPlayerId: (playerId: string) =>
    client
      .from('match_player_results')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false }),
  getJoinedPlayerResults: (playerId: string) =>
    client
      .from('match_player_results')
      .select(
        '*, match:matches(home_team(*), away_team(*), config(*), players:match_players(*), results:match_results(*))'
      )
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .returns<Array<PlayerResultsJoined>>(),
  createMatchServers: (
    matchId: number,
    ...servers: Array<Omit<MatchServersInsert, 'id'>>
  ) =>
    client
      .from('match_servers')
      .insert(servers.map((server) => ({ id: matchId, ...server })))
      .select('*, server(*)')
      .returns<Array<{ id: number; server: ServersRow }>>(),
  deleteMatchServer: (id: number, address: string) =>
    client.from('match_servers').delete().eq('id', id).eq('server', address).select('*'),
  deleteAllMatchServers: (id: number) =>
    client.from('match_servers').delete().eq('id', id).select('*'),
  getMatchServers: (id: number) =>
    client.from('matches').select('id, servers(*)').eq('id', id).single<MatchServers>(),
  updateMatchServer: (matchId: number | undefined, values: MatchServersUpdate) =>
    client
      .from('match_servers')
      .update(values)
      .eq('id', matchId)
      .select('*, server(*)')
      .single<MatchServers>(),
});
