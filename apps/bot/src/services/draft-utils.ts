import {
  MatchPlayersInsert,
  PickedMatchPlayer,
  RatedMatchPlayer,
} from '@bf2-matchmaking/types';
import { shuffleArray } from '@bf2-matchmaking/utils';
import { Embed } from 'discord.js';
import { getUserIds } from './utils';

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

export function getAverageRating(players: Array<RatedMatchPlayer>) {
  return players.reduce((acc, cur) => acc + cur.rating, 0) / players.length;
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

function findCaptain(
  teams: Array<MatchPlayersInsert>,
  embed: Embed,
  team: 'USMC' | 'MEC/PLA'
) {
  const captain = getUserIds(embed, team).at(0);
  return teams.find((mp) => mp.player_id === captain);
}
