import { isDefined, RatedMatchPlayer } from '@bf2-matchmaking/types';
import { sumRating } from '@bf2-matchmaking/services/players';
import { compareRating } from './player-utils';
import { shuffleArray } from './array-utils';

export function getTeamsByRating(players: Array<RatedMatchPlayer>) {
  const sorted = [...players].sort(compareRating);
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

  return [team1.filter(isDefined), team2.filter(isDefined)];
}

export function getTeamsByRandom(players: Array<RatedMatchPlayer>) {
  const randomPlayers = shuffleArray(players);
  return [
    randomPlayers.slice(0, randomPlayers.length / 2),
    randomPlayers.slice(randomPlayers.length / 2, -1),
  ];
}
