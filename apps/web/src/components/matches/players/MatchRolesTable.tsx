import { MatchrolesRow } from '@bf2-matchmaking/schemas/types';
import ActionButton from '@/components/commons/action/ActionButton';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { removeMatchRole } from '@/app/matches/[match]/actions';
import RoleAvatar from '@/components/commons/RoleAvatar';

interface Props {
  matchRoles: Array<MatchrolesRow>;
}

export default function MatchRolesTable({ matchRoles }: Props) {
  return (
    <table className="table table-xs w-md bg-base-200">
      <thead>
        <tr>
          <th></th>
          <th>Name</th>
          <th>Count</th>
          <th>Priority</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {matchRoles.map((role) => (
          <tr key={role.name}>
            <td>
              <RoleAvatar role={role.name} />
            </td>
            <td>{role.name}</td>
            <td>{role.count}</td>
            <td>{role.priority}</td>
            <td>
              <ActionButton
                style="ghost"
                action={removeMatchRole}
                input={{ matchId: role.match_id, role: role.name }}
              >
                <XMarkIcon className="size-6" />
              </ActionButton>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
