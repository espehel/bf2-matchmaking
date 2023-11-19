import { TeamsJoined } from '@bf2-matchmaking/types';
import { PencilSquareIcon } from '@heroicons/react/24/solid';
import { TeamAvatar } from '@/components/TeamAvatar';
import IconBtn from '@/components/commons/IconBtn';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {
  team: TeamsJoined;
}

export default async function TeamDetailsSection({ team }: Props) {
  const isTeamOfficer = await supabase(cookies).isTeamPlayerOfficer(team.id);

  return (
    <section className="section flex-row">
      <h2 className="hidden">Team details</h2>
      <div className="flex items-center gap-6">
        <TeamAvatar team={team} />
        <div className="flex flex-col gap-1.5">
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
      {isTeamOfficer && (
        <IconBtn
          Icon={PencilSquareIcon}
          size="sm"
          href={`/teams/${team.id}/?edit=true`}
          className="ml-auto text-secondary"
        />
      )}
    </section>
  );
}
