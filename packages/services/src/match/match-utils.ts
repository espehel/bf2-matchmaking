import { MatchesJoined, MatchProcessError } from '@bf2-matchmaking/types';
import { mapToKeyhashes } from '@bf2-matchmaking/utils';

export function validateMatch(match: MatchesJoined): Array<MatchProcessError> {
  const errors: Array<MatchProcessError> = [];
  if (match.config.maps * 2 < match.rounds.length) {
    errors.push('EXTRA_ROUNDS');
  }
  if (match.config.maps * 2 > match.rounds.length) {
    errors.push('MISSING_ROUNDS');
  }
  if (!validateMatchPlayers(match)) {
    errors.push('MISSING_PLAYERS');
  }
  return errors;
}

export function validateMatchPlayers(match: MatchesJoined) {
  const playerKeys = mapToKeyhashes(match.rounds);

  return match.players.every(
    (player) => player.keyhash && playerKeys.includes(player.keyhash)
  );
}
