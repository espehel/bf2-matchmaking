import { TeamsJoined } from '@bf2-matchmaking/types';
import { ArrowUpOnSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { TeamAvatar } from '@/components/TeamAvatar';
import { updateTeam } from '@/app/teams/[team]/actions';
import PlayerCombobox from '@/components/PlayerCombobox';
import IconBtn from '@/components/commons/IconBtn';
import ActionForm from '@/components/form/ActionForm';

interface Props {
  team: TeamsJoined;
}

export default function TeamDetailsForm({ team }: Props) {
  async function updateTeamSA(data: FormData) {
    'use server';
    return updateTeam(team.id, data);
  }

  return (
    <ActionForm
      action={updateTeamSA}
      successMessage="Team updated"
      errorMessage="Failed to update team"
      className="section flex-row"
      redirect={`/teams/${team.id}`}
    >
      <h2 className="hidden">Team details</h2>
      <div className="flex items-center gap-6">
        <TeamAvatar team={team} />
        <div className="flex flex-col gap-1">
          <div>
            <span className="mr-1">Name:</span>
            <input
              name="name"
              defaultValue={team.name}
              className="input input-bordered input-xs"
              placeholder={team.name}
            />
          </div>
          <div>
            <span className="mr-1">Discord ID:</span>
            <input
              name="discord_role"
              defaultValue={team.discord_role || ''}
              className="input input-bordered input-xs"
              placeholder={team.discord_role || ''}
            />
          </div>
          <div>
            <span className="mr-1">Owner:</span>
            <PlayerCombobox
              defaultValue={team.owner}
              placeholder={team.owner.nick}
              size="xs"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-2 ml-auto">
        <IconBtn
          type="submit"
          size="sm"
          Icon={ArrowUpOnSquareIcon}
          className="text-secondary"
        />
        <IconBtn
          href={`/teams/${team.id}`}
          size="sm"
          Icon={XMarkIcon}
          className="text-error"
        />
      </div>
    </ActionForm>
  );
}
