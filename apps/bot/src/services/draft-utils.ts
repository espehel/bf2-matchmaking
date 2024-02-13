import { PickedMatchPlayer, RatedMatchPlayer } from '@bf2-matchmaking/types';
import { shuffleArray } from '@bf2-matchmaking/utils';
import { Embed } from 'discord.js';
import { getUserIds } from './utils';

export const AUTO_DRAFT_CONFIGS = [2, 9];

export function buildMixTeams(
  teams: Array<RatedMatchPlayer>
): [Array<PickedMatchPlayer>, Array<PickedMatchPlayer>] {
  const [teamA, teamB] = getTeamsBySnakeDraft(teams);
  const team1 = teamA.sort(compareRating).map(withTeamAndCaptain(1));
  const team2 = teamB.sort(compareRating).map(withTeamAndCaptain(2));
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

function compareRating(mpA: RatedMatchPlayer, mpB: RatedMatchPlayer) {
  return mpB.rating - mpA.rating;
}

function withTeamAndCaptain(team: number) {
  return (mp: RatedMatchPlayer, index: number): PickedMatchPlayer => ({
    ...mp,
    captain: index === 0,
    team,
  });
}

export function buildDraftOrder(
  teams: [Array<PickedMatchPlayer>, Array<PickedMatchPlayer>],
  embed: Embed
): [Array<string>, Array<PickedMatchPlayer>] {
  const [team1, team2] = teams;
  const unpick = [...getUserIds(embed, 'USMC'), ...getUserIds(embed, 'MEC/PLA')];
  const pick = [
    team1[0],
    team2[0],
    ...shuffleArray(team1.slice(1).concat(team2.slice(1))),
  ];

  return [unpick, pick];
}
