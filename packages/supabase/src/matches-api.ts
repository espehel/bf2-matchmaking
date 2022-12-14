import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { MatchesInsert, MatchesJoined, MatchesUpdate, MatchPlayersRow } from './types';

export default (client: SupabaseClient<Database>) => ({
  createMatch: (values: MatchesInsert) =>
    client
      .from('matches')
      .insert([values])
      .select<
        '*, players(*), maps(*), channel(*), teams:match_players(player_id, team, captain), server(*)',
        MatchesJoined
      >(
        '*, players(*), maps(*), channel(*), teams:match_players(player_id, team, captain), server(*)'
      )
      .single(),
  getMatches: () => client.from('matches').select('*'),
  getOpenMatches: () =>
    client
      .from('matches')
      .select<
        '*, players(*), maps(*), channel(*), teams:match_players(player_id, team, captain), server(*)',
        MatchesJoined
      >(
        '*, players(*), maps(*), channel(*), teams:match_players(player_id, team, captain), server(*)'
      )
      .eq('status', 'open'),
  getOpenMatchesByChannel: (channel: number) =>
    client
      .from('matches')
      .select<
        '*, players(*), maps(*), channel(*), teams:match_players(player_id, team, captain), server(*)',
        MatchesJoined
      >(
        '*, players(*), maps(*), channel(*), teams:match_players(player_id, team, captain), server(*)'
      )
      .eq('status', 'open')
      .eq('channel.id', channel),
  getMatch: (matchId: number | undefined) =>
    client
      .from('matches')
      .select<
        '*, players(*), maps(*), channel(*), teams:match_players(player_id, team, captain), server(*)',
        MatchesJoined
      >(
        '*, players(*), maps(*), channel(*), teams:match_players(player_id, team, captain), server(*)'
      )
      .eq('id', matchId)
      .single(),

  updateMatch: (matchId: number | undefined, values: MatchesUpdate) =>
    client.from('matches').update(values).eq('id', matchId),

  createMatchPlayer: (match_id: number, player_id: string) =>
    client.from('match_players').insert([{ match_id, player_id }]),

  deleteMatchPlayer: (matchId: string, playerId: string) =>
    client
      .from('match_players')
      .delete()
      .eq('match_id', matchId)
      .eq('player_id', playerId),

  updateMatchPlayer: (
    matchId: number,
    playerId: string,
    values: Partial<MatchPlayersRow>
  ) =>
    client
      .from('match_players')
      .update(values)
      .eq('match_id', matchId)
      .eq('player_id', playerId),

  createMatchMaps: (match_id: number, ...maps: Array<number>) =>
    client.from('match_maps').insert(maps.map((mapId) => ({ match_id, map_id: mapId }))),
  getStartedMatchesByServer: (serverIp: string) =>
    client.from('matches').select('*').eq('status', 'started').eq('server', serverIp),
});
