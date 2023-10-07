import { TeamsJoined } from '@bf2-matchmaking/types';
import { PencilSquareIcon } from '@heroicons/react/24/solid';
import { TeamAvatar } from '@/components/TeamAvatar';
import IconBtn from '@/components/commons/IconBtn';

interface Props {
  team: TeamsJoined;
}

export default function TeamDetailsSection({ team }: Props) {
  return (
    <section className="section flex-row-reverse">
      <h2 className="hidden">Team details</h2>
      <IconBtn
        Icon={PencilSquareIcon}
        size="sm"
        href={`/teams/${team.id}/?edit=true`}
        className="ml-auto text-secondary"
      />
      <div className="flex items-center gap-6">
        <TeamAvatar team={team} />
        <div>
          <div>
            <span className="mr-1">Name:</span>
            <span>{team.name}</span>
          </div>
          <div>
            <span className="mr-1">Discord ID:</span>
            <span>{team.discord_role || 'None'}</span>
          </div>
          <div>
            <span className="mr-1">Owner:</span>
            <span>{team.owner.full_name}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
