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
  MatchStatus,
  PlayersInsert,
  PlayersUpdate,
} from '@bf2-matchmaking/types';

const MATCHES_JOINED_QUERY =
  '*, players!match_players(*), maps(*), config!inner(*), teams:match_players(*), server(*), rounds(*, map(*), server(*), team1(*), team2(*)), home_team(*, players:team_players(*, player:players(*))), away_team(*, players:team_players(*, player:players(*)))';
export default (client: SupabaseClient<Database>) => ({
  createMatchFromConfig: (config: number) =>
    client
      .from('matches')
      .insert([{ config }])
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .single(),
  createScheduledMatch: (
    config: number,
    home_team: number,
    away_team: number,
    scheduled_at: string,
    server?: string | null
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
          server,
        },
      ])
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .single(),
  getMatches: () =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY),
  getScheduledMatches: (scheduledAfter: string) =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .gte('scheduled_at', scheduledAfter),
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
  getMatchesWithStatus: (status: MatchStatus) =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .or(`status.eq.${status}`),
  getStagingMatchesByConfig: (configId: number) =>
    client
      .from('matches')
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .eq('config', configId)
      .or(
        `status.eq.${MatchStatus.Open},status.eq.${MatchStatus.Summoning},status.eq.${MatchStatus.Drafting}`
      ),
  updateMatch: (matchId: number | undefined, values: MatchesUpdate) =>
    client
      .from('matches')
      .update(values)
      .eq('id', matchId)
      .select<typeof MATCHES_JOINED_QUERY, MatchesJoined>(MATCHES_JOINED_QUERY)
      .single(),
  createMatchPlayer: (
    match_id: number,
    player_id: string,
    values: Partial<MatchPlayersRow>
  ) => client.from('match_players').insert([{ match_id, player_id, ...values }]),
  createMatchPlayers: (players: Array<MatchPlayersInsert>) =>
    client.from('match_players').insert(players),
  deleteMatchPlayer: (matchId: number, playerId: string) =>
    client
      .from('match_players')
      .delete()
      .eq('match_id', matchId)
      .eq('player_id', playerId),
  deleteMatchPlayersForMatchId: (matchId: number, players: Array<MatchPlayersRow>) =>
    client
      .from('match_players')
      .delete()
      .eq('match_id', matchId)
      .in(
        'player_id',
        players.map((mp) => mp.player_id)
      ),
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
      .select(),
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
  getOngoingMatchesByServer: (serverIp: string) =>
    client
      .from('matches')
      .select('*')
      .eq('status', MatchStatus.Ongoing)
      .eq('server', serverIp),
  createMatchResult: (...results: Array<MatchResultsInsert>) =>
    client
      .from('match_results')
      .insert(results)
      .select<'*, team(*)', MatchResultsJoined>('*, team(*)'),
  createMatchPlayerResults: (...results: Array<MatchPlayerResultsInsert>) =>
    client.from('match_player_results').insert(results).select(),
  getMatchResults: () =>
    client.from('match_results').select<'*, team(*)', MatchResultsJoined>('*, team(*)'),
  getMatchResultsByMatchId: (matchId: number) =>
    client
      .from('match_results')
      .select<'*, team(*)', MatchResultsJoined>('*, team(*)')
      .eq('match_id', matchId),
  getPlayerMatchResultsByMatchId: (matchId: number) =>
    client
      .from('match_player_results')
      .select<'*, player:players(*)', MatchPlayerResultsJoined>('*, player:players(*)')
      .eq('match_id', matchId)
      .order('score', { ascending: false }),
});
