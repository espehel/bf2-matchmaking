import { SupabaseClient } from '@supabase/supabase-js';
import matches from './matches-api';
import {
  AdminRolesInsert,
  AdminRolesUpdate,
  Challenge,
  ChallengesInsert,
  ChallengesUpdate,
  ChallengeTeamsInsert,
  Database,
  DbServer,
  DiscordConfig,
  EventMatchesUpdate,
  EventsJoined,
  GeneratedServersInsert,
  MatchConfigResults,
  MatchConfigsRow,
  MatchConfigType,
  PlayerRating,
  PlayerRatingsInsert,
  PlayerRatingsJoined,
  PlayersInsert,
  PlayersUpdate,
  RoundsInsert,
  RoundsJoined,
  ServerRconsInsert,
  ServerRconsUpdate,
  ServersInsert,
  ServersUpdate,
  TeamPlayersInsert,
  TeamPlayersUpdate,
  TeamsInsert,
  TeamsJoined,
  TeamsRow,
  TeamsUpdate,
  ActiveTeam,
  InactiveTeam,
  EventsInsert,
  EventsUpdate,
} from '@bf2-matchmaking/types';

const ROUNDS_JOINED_QUERY = '*, map(*), server(*), team1(*), team2(*)';
const EVENT_QUERY =
  '*, teams!event_teams(*), rounds:event_rounds!event_rounds_event_fkey(*, matches:event_matches(*)), matches!event_matches(id, home_team(*), away_team(*))';

export default (client: SupabaseClient<Database>) => ({
  ...matches(client),
  getServerRcons: () => client.from('server_rcons').select('*'),
  getServerRcon: (ip: string) =>
    client.from('server_rcons').select('*').eq('id', ip).single(),
  getPlayerByUserId: (userId: string) =>
    client.from('players').select('*').eq('user_id', userId).single(),
  getPlayerByKeyhash: (keyhash: string) =>
    client.from('players').select('*').eq('keyhash', keyhash).single(),
  getPlayerByTeamspeakId: (clid: string) =>
    client.from('players').select('*').eq('teamspeak_id', clid).single(),
  getPlayersByKeyhashList: (keyhashes: Array<string>) =>
    client.from('players').select('*').in('keyhash', keyhashes),
  getPlayers: () => client.from('players').select('*'),
  getBetaPlayers: () => client.from('players').select('*').eq('beta_tester', true),
  getPlayersByMatchId: (matchId: number) =>
    client
      .from('matches')
      .select('match_id:id, players!match_players(*)')
      .eq('id', matchId)
      .single(),
  getPlayersByIdList: (idList: Array<string>) =>
    client.from('players').select('*').in('id', idList),
  getPlayerRatings: (playerId: string) =>
    client
      .from('player_ratings')
      .select('*, config(id, name)')
      .eq('player_id', playerId)
      .returns<Array<PlayerRatingsJoined>>(),
  getPlayerRating: (playerId: string, config: number) =>
    client
      .from('player_ratings')
      .select('*')
      .eq('config', config)
      .eq('player_id', playerId)
      .single(),
  getPlayerRatingsByIdList: (idList: Array<string>, config: number) =>
    client
      .from('player_ratings')
      .select('*')
      .eq('config', config)
      .in('player_id', idList),
  getRatingsByConfig: (config: number) =>
    client.from('player_ratings').select('*').eq('config', config),
  getPlayerRatingsByConfig: (config: number) =>
    client
      .from('player_ratings')
      .select<'*, player:players(nick)', PlayerRating>('*, player:players(nick)')
      .eq('config', config),
  getPlayersWithJoinTime: () =>
    client.from('players').select('*, match_players(connected_at, matches(started_at))'),
  upsertPlayerRatings: (playerRatings: Array<PlayerRatingsInsert>) =>
    client.from('player_ratings').upsert(playerRatings).select('*'),
  searchPlayers: (query: string) =>
    client.from('players').select('*').ilike('nick', `%${query}%`).limit(10),
  getPlayer: (playerId: string) =>
    client.from('players').select('*').eq('id', playerId).single(),
  createPlayer: (player: PlayersInsert) =>
    client.from('players').insert([player]).select().single(),
  upsertPlayers: (players: Array<PlayersInsert>) =>
    client.from('players').upsert(players).select(),
  updatePlayer: (playerId: string, values: PlayersUpdate) =>
    client.from('players').update(values).eq('id', playerId).select('*').single(),
  updatePlayers: (values: Array<PlayersUpdate>) =>
    client
      .from('players')
      .upsert(values as Array<PlayersInsert>)
      .select('*'),
  getRound: (id: number) =>
    client
      .from('rounds')
      .select<typeof ROUNDS_JOINED_QUERY, RoundsJoined>(ROUNDS_JOINED_QUERY)
      .eq('id', id)
      .single(),
  getRounds: (limit?: number) =>
    client
      .from('rounds')
      .select<typeof ROUNDS_JOINED_QUERY, RoundsJoined>(ROUNDS_JOINED_QUERY)
      .order('id', { ascending: false })
      .limit(limit || 50),
  createServer: (server: ServersInsert) =>
    client.from('servers').insert([server]).select().single(),
  createServerRcon: (server: ServerRconsInsert) =>
    client.from('server_rcons').insert([server]),
  updateServer: (ip: string, values: ServersUpdate) =>
    client.from('servers').update(values).eq('ip', ip).select().single(),
  updateServerRcon: (id: string, values: ServerRconsUpdate) =>
    client.from('server_rcons').update(values).eq('id', id).select(),
  deleteServer: (ip: string) => client.from('servers').delete().eq('ip', ip).select(),
  deleteServerRcon: (ip: string) =>
    client.from('server_rcons').delete().eq('id', ip).select(),
  getServers: () =>
    client.from('servers').select('*, rcon:server_rcons(*)').returns<Array<DbServer>>(),
  getServer: (ip: string) => client.from('servers').select('*').eq('ip', ip).single(),
  getServerByName: (name: string) =>
    client.from('servers').select('*').eq('name', name).single(),
  getServerByNameSearch: (name: string) =>
    client.from('servers').select('*').textSearch('name', name, {
      type: 'websearch',
      config: 'english',
    }),
  getMatchConfigByChannelId: (channelId: string) =>
    client
      .from('match_configs')
      .select<'*', DiscordConfig>('*')
      .eq('channel', channelId)
      .single(),
  getMatchConfigs: () => client.from('match_configs').select<'*', MatchConfigsRow>('*'),
  getMatchConfigsWithType: (configType: MatchConfigType) =>
    client.from('match_configs').select<'*', MatchConfigsRow>('*').eq('type', configType),
  getMatchConfig: (id: number) =>
    client.from('match_configs').select('*').eq('id', id).single<MatchConfigsRow>(),
  getMatchConfigResults: (id: number) =>
    client
      .from('match_configs')
      .select(
        '*, matches(id, scheduled_at, status, home_team(*), away_team(*), results:match_results(*))'
      )
      .eq('id', id)
      .single<MatchConfigResults>(),
  createRound: (round: RoundsInsert) =>
    client.from('rounds').insert([round]).select().single(),
  getMaps: () => client.from('maps').select('*'),
  searchMap: (map: string) =>
    client.from('maps').select().textSearch('name', `'${map}'`).single(),
  upsertServer: (values: ServersInsert) =>
    client.from('servers').upsert(values).select().single(),
  upsertServerRcon: (values: ServerRconsInsert) =>
    client.from('server_rcons').upsert(values).select().single(),
  getMatchAdmins: () => client.from('admin_roles').select('*').eq('match_admin', true),
  getAdmins: () => client.from('admin_roles').select('*, player:players(*)'),
  getAdminRoles: (userId: string) =>
    client.from('admin_roles').select('*').eq('user_id', userId).single(),
  insertAdminRole: (role: AdminRolesInsert) =>
    client.from('admin_roles').insert(role).select('*').single(),
  updateAdminRole: (userId: string, values: AdminRolesUpdate) =>
    client.from('admin_roles').update(values).eq('user_id', userId).select('*').single(),
  deleteAdminRole: (userId: string) =>
    client.from('admin_roles').delete().eq('user_id', userId),
  createTeam: (team: TeamsInsert) => client.from('teams').insert(team).select().single(),
  getInactiveTeams: () =>
    client
      .from('teams')
      .select('*, owner(*)')
      .eq('active', false)
      .returns<Array<InactiveTeam>>(),
  getActiveTeams: () =>
    client
      .from('teams')
      .select('*, owner(*), players:team_players(*),challenges:challenge_teams(*)')
      .eq('active', true)
      .returns<Array<ActiveTeam>>(),
  getTeam: (id: number) =>
    client
      .from('teams')
      .select<
        '*, owner(*), players!team_players(*), captains:team_players(*), challenges:challenge_teams(*)',
        TeamsJoined
      >(
        '*, owner(*), players!team_players(*), captains:team_players(*), challenges:challenge_teams(*)'
      )
      .eq('id', id)
      .eq('captains.captain', true)
      .single(),
  getTeamByDiscordRole: (roleId: string) =>
    client.from('teams').select('*').eq('discord_role', roleId).single(),
  getTeamsByPlayerId: (playerId: string) =>
    client
      .from('teams')
      .select('*, players!team_players!inner(id)')
      .eq('players.id', playerId)
      .returns<Array<TeamsRow>>(),
  updateTeam: (teamId: number, values: TeamsUpdate) =>
    client.from('teams').update(values).eq('id', teamId).select(),
  searchTeams: (query: string) =>
    client.from('teams').select('*').ilike('name', `%${query}%`).limit(10),
  createTeamPlayer: (team: TeamPlayersInsert) =>
    client.from('team_players').insert(team).select().single(),
  updateTeamPlayer: (teamId: number, playerId: string, values: TeamPlayersUpdate) =>
    client
      .from('team_players')
      .update(values)
      .eq('team_id', teamId)
      .eq('player_id', playerId)
      .select()
      .single(),
  getTeamPlayersByPlayerId: (playerId: string) =>
    client.from('team_players').select('*').eq('player_id', playerId),
  deleteTeamPlayer: (teamId: number, playerId: string) =>
    client.from('team_players').delete().eq('team_id', teamId).eq('player_id', playerId),
  createEvent: (values: EventsInsert) => client.from('events').insert(values).select('*'),
  getEvents: () => client.from('events').select('*'),
  getEvent: (id: number) =>
    client.from('events').select(EVENT_QUERY).eq('id', id).single<EventsJoined>(),
  updateEvent: (eventId: number, values: EventsUpdate) =>
    client.from('events').update(values).eq('id', eventId).select('*'),
  getEventMatch: (match: number) =>
    client.from('event_matches').select('*').eq('match', match).single(),
  createEventTeam: (event: number, team: number) =>
    client.from('event_teams').insert({ event, team }).select('*').single(),
  createEventRound: (event: number, label: string, start_at: string) =>
    client.from('event_rounds').insert({ event, label, start_at }).select('*').single(),
  createEventMatch: (event: number, round: number, match: number) =>
    client.from('event_matches').insert({ event, round, match }).select('*').single(),
  deleteEventRound: (round: number) =>
    client.from('event_rounds').delete().eq('id', round).select('*').single(),
  deleteEventMatch: (match: number) =>
    client.from('event_matches').delete().eq('match', match).select('*').single(),
  updateEventMatch: (match: number, values: EventMatchesUpdate) =>
    client.from('event_matches').update(values).eq('match', match).select('*').single(),
  deleteEventTeam: (event: number, team: number) =>
    client
      .from('event_teams')
      .delete()
      .eq('team', team)
      .eq('event', event)
      .select('*')
      .single(),
  getGeneratedServersByMatchId: (matchId: number) =>
    client.from('generated_servers').select('*').eq('match_id', matchId),
  createGeneratedServer: (values: GeneratedServersInsert) =>
    client.from('generated_servers').insert(values).select('*').single(),
  createChallenge: (challenge: ChallengesInsert) =>
    client.from('challenges').insert([challenge]).select('*').single(),
  getChallenges: () =>
    client
      .from('challenges')
      .select(
        '*, config(*), home_team(*), away_team(*), home_map(*), home_server(*), away_map(*), away_server(*)'
      )
      .returns<Array<Challenge>>(),
  getChallenge: (challengeId: number) =>
    client
      .from('challenges')
      .select(
        '*, config(*), home_team(*), away_team(*), home_map(*), home_server(*), away_map(*), away_server(*)'
      )
      .eq('id', challengeId)
      .single<Challenge>(),
  getChallengeByMatchId: (matchId: number) =>
    client
      .from('challenges')
      .select(
        '*, config(*), home_team(*), away_team(*), home_map(*), home_server(*), away_map(*), away_server(*)'
      )
      .eq('match', matchId)
      .single<Challenge>(),
  updateChallenge: (challengeId: number, values: ChallengesUpdate) =>
    client.from('challenges').update(values).eq('id', challengeId).select('*').single(),
  insertChallengeTeam: (values: ChallengeTeamsInsert) =>
    client.from('challenge_teams').insert(values).select('*').single(),
  getChallengeTeam: (teamId: number, configId: number) =>
    client
      .from('challenge_teams')
      .select('*')
      .eq('team_id', teamId)
      .eq('config', configId)
      .single(),
  getChallengeTeamsByConfig: (configId: number) =>
    client.from('challenge_teams').select('*, team:teams(*)').eq('config', configId),
  updateChallengeTeamRating: (
    teamId: number,
    configId: number,
    rating: number,
    match_count: number
  ) =>
    client
      .from('challenge_teams')
      .update({ rating, match_count })
      .eq('team_id', teamId)
      .eq('config', configId)
      .select('*')
      .single(),
});
