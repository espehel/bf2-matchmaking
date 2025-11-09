import {
  ResolvableSupabaseClient,
  verifyResult,
  verifySingleResult,
} from '@bf2-matchmaking/supabase';
import { events as createEventsApi } from '@bf2-matchmaking/supabase/events';
import { results as createResultsApi } from '@bf2-matchmaking/supabase/results';
import { EventsMatch } from '@bf2-matchmaking/types';
import { calculateLeaguePoints } from '@bf2-matchmaking/utils';

type StandingsRecord = Record<
  number,
  {
    name: string;
    points: number;
    tickets: number;
    ticketsDiff: number;
    matchesPlayed: number;
  }
>;

export function createResultsService(dbClient: ResolvableSupabaseClient) {
  const events = createEventsApi(dbClient);
  const results = createResultsApi(dbClient);

  async function getStandings(eventId: number): Promise<StandingsRecord> {
    const event = await events.get(eventId).then(verifySingleResult);
    const results = await _getMatchResults(event.matches);

    return results.reduce((acc, curr) => {
      const [teamId, name, points, tickets, ticketsDiff] = curr;
      const accTeam = acc[teamId];

      if (!accTeam) {
        return {
          ...acc,
          [teamId]: { name, points, tickets, ticketsDiff, matchesPlayed: 1 },
        } as StandingsRecord;
      }

      return {
        ...acc,
        [teamId]: {
          name: name,
          points: accTeam.points + points,
          tickets: accTeam.tickets + tickets,
          ticketsDiff: accTeam.ticketsDiff + ticketsDiff,
          matchesPlayed: accTeam.matchesPlayed + 1,
        },
      } as StandingsRecord;
    }, {} as StandingsRecord);
  }

  async function _getMatchResults(
    matches: Array<EventsMatch>
  ): Promise<Array<[number, string, number, number, number]>> {
    const matchResults = await results
      .getByMatchIds(matches.map((m) => m.id))
      .then(verifyResult);

    return matches
      .map((match) => {
        const homeResult = matchResults?.find(
          (r) => r.match_id === match.id && r.team.id === match.home_team.id
        );
        const awayResult = matchResults?.find(
          (r) => r.match_id === match.id && r.team.id === match.away_team.id
        );

        if (!homeResult || !awayResult) {
          return [];
        }

        const [homePoints, awayPoints] = calculateLeaguePoints(homeResult, awayResult);

        return [
          [
            match.home_team.id,
            match.home_team.name,
            homePoints,
            homeResult.tickets,
            homeResult.tickets - awayResult.tickets,
          ] as [number, string, number, number, number],
          [
            match.away_team.id,
            match.away_team.name,
            awayPoints,
            awayResult.tickets,
            awayResult.tickets - homeResult.tickets,
          ] as [number, string, number, number, number],
        ];
      })
      .flat();
  }
  return {
    getStandings,
  };
}
