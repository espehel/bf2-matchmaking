import {
  MatchesJoined,
  MatchPlayersRow,
  MatchTeam,
  RatedMatchPlayer,
} from '@bf2-matchmaking/types';
import { isTeam } from '@bf2-matchmaking/utils';
import {
  MatchplayersRow,
  MatchrolesRow,
  PlayersRow,
  PublicMatchRole,
} from '@bf2-matchmaking/schemas/types';
import RoleAvatar from '@/components/commons/RoleAvatar';
import { matches } from '@/lib/supabase/supabase-server';
import { verifyResult } from '@bf2-matchmaking/supabase';

interface Props {
  match: MatchesJoined;
  team: MatchTeam;
}

export default async function TeamList({ match, team }: Props) {
  const roles = await matches.roles.get(match.id).then(verifyResult);

  const matchTeam = match.teams.filter(isTeam(team.id));

  return (
    <ul className="list">
      <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">{`Team ${team.name}`}</li>
      {mergePlayersWithRoles(match, roles, team.id).map((element, i) => {
        if (Array.isArray(element)) {
          const [player, mp] = element;
          return (
            <li key={player.id} className="list-row p-2">
              <RoleAvatar role={mp.role} className="size-6" />
              <span className="font-semibold">{player.nick}</span>
              <span className="text-xs opacity-60">{mp.rating}</span>
            </li>
          );
        }
        return (
          <li key={`${element.name}${i}`} className="list-row p-2">
            <RoleAvatar role={element.name} />
            <span className="font-semibold opacity-30">{toRoleLabel(element.name)}</span>
          </li>
        );
      })}
      <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">{`Avg rating: ${
        matchTeam.reduce(sumRating, 0) / matchTeam.length
      }`}</li>
    </ul>
  );
}

function getPlayer(match: MatchesJoined, id: string): PlayersRow {
  const player = match.players.find((p) => p.id === id);
  if (!player) {
    throw new Error(`Player with id ${id} not found in match ${match.id}`);
  }
  return player;
}

function toRoleLabel(role: PublicMatchRole) {
  switch (role) {
    case 'apc':
      return 'APC';
    case 'cmd':
      return 'Commander';
    case 'inf':
      return 'Infantry';
    case 'heli':
      return 'Chopper';
    case 'tank':
      return 'Tank';
    case 'sl':
      return 'Squad Leader';
  }
}

function mergePlayersWithRoles(
  match: MatchesJoined,
  matchRoles: Array<MatchrolesRow>,
  teamId: number
): Array<[PlayersRow, MatchplayersRow] | MatchrolesRow> {
  const players: Array<[PlayersRow, MatchplayersRow]> = match.teams
    .filter(isTeam(teamId))
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
    .map((mp) => [getPlayer(match, mp.player_id), mp] as [PlayersRow, MatchplayersRow]);

  const rolesByPri = [...matchRoles].sort((a, b) => a.priority - b.priority);

  const rolesAndPlayers = rolesByPri
    .flatMap((role) => Array.from({ length: role.count }, () => role))
    .reduce((acc, role) => {
      const playerTuple = players.find(
        ([p, mp]) => mp.role === role.name && !acc.some(isPlayer(p.id))
      );
      if (!playerTuple) {
        return [...acc, role];
      }
      return [...acc, playerTuple];
    }, [] as Array<[PlayersRow, MatchplayersRow] | MatchrolesRow>);

  const unassignedPlayers: Array<[PlayersRow, MatchplayersRow]> = players.filter(
    ([p]) => !rolesAndPlayers.some(isPlayer(p.id))
  );
  return [...rolesAndPlayers, ...unassignedPlayers];
}

function isPlayer(playerId: string) {
  return (element: [PlayersRow, MatchplayersRow] | MatchrolesRow) => {
    if (Array.isArray(element)) {
      return element[0].id === playerId;
    }
    return false;
  };
}

function sumRating(acc: number, cur: RatedMatchPlayer) {
  return acc + cur.rating;
}
