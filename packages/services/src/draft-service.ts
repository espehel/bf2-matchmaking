import {
  MatchConfigsRow,
  MatchPlayersInsert,
  PickedMatchPlayer,
  PlayerRatingsRow,
  RatedMatchPlayer,
} from '@bf2-matchmaking/types';
import { compareRating, shuffleArray } from '@bf2-matchmaking/utils';
import { logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { client, verifyResult } from '@bf2-matchmaking/supabase';
import { sumRating, withRating } from './player-service';

export async function buildDraftWithConfig(
  players: Array<MatchPlayersInsert>,
  config: MatchConfigsRow
): Promise<Array<PickedMatchPlayer>> {
  try {
    const ratings = await client()
      .getPlayerRatingsByIdList(
        players.map((p) => p.player_id),
        config.id
      )
      .then(verifyResult);

    const draft = buildMixTeams(players, ratings);
    logMessage(`${config.name}: Draft created`, { draft, config, ratings, players });
    return [...draft[0], ...draft[1]];
  } catch (e) {
    logErrorMessage(`Failed to create draft for ${config.name}`, e, {
      config,
      players,
    });
    throw e;
  }
}

export function buildMixTeams(
  teams: Array<MatchPlayersInsert>,
  ratings: Array<PlayerRatingsRow>
): [Array<PickedMatchPlayer>, Array<PickedMatchPlayer>] {
  const [teamA, teamB] = getTeamsByGGDraft(teams.map(withRating(ratings)));
  const team1 = teamA.sort(compareRating).map(withTeamAndCaptain(1));
  const team2 = teamB.sort(compareRating).map(withTeamAndCaptain(2));
  return [team1, team2];
}
function getTeamsByGGDraft(players: Array<RatedMatchPlayer>) {
  const sorted = [...players].sort((a, b) => b.rating - a.rating);
  const team1 = [];
  const team2 = [];

  for (let i = 0; i < sorted.length; i += 2) {
    const team1Sum = team1.reduce(sumRating, 0);
    const team2Sum = team2.reduce(sumRating, 0);
    if (team1Sum < team2Sum) {
      team1.push(sorted[i]);
      team2.push(sorted[i + 1]);
    } else {
      team2.push(sorted[i]);
      team1.push(sorted[i + 1]);
    }
  }
  return [team1, team2];
}
function getTeamsBySnakeDraft(
  players: Array<RatedMatchPlayer>
): [Array<RatedMatchPlayer>, Array<RatedMatchPlayer>] {
  const sorted = [...players].sort((a, b) => a.rating - b.rating);
  const team1 = [];
  const team2 = [];

  for (let i = 0; i < sorted.length; i++) {
    const round = Math.floor(i / 2);
    if (round % 2 === 0) {
      if (i % 2 === 0) {
        team1.push(sorted[i]);
      } else {
        team2.push(sorted[i]);
      }
    } else {
      if (i % 2 === 0) {
        team2.push(sorted[i]);
      } else {
        team1.push(sorted[i]);
      }
    }
  }
  return [team1, team2];
}

function withTeamAndCaptain(team: number) {
  return (mp: RatedMatchPlayer, index: number): PickedMatchPlayer => ({
    ...mp,
    captain: index === 0,
    team,
  });
}

export function buildDraftOrder(
  teams: [Array<PickedMatchPlayer>, Array<PickedMatchPlayer>]
): Array<PickedMatchPlayer> {
  const [team1, team2] = teams;
  return [team1[0], team2[0], ...shuffleArray(team1.slice(1).concat(team2.slice(1)))];
}
