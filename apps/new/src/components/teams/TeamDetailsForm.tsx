'use client';
import { TeamsJoined } from '@bf2-matchmaking/types';
import { ArrowUpOnSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { TeamAvatar } from '@/components/TeamAvatar';
import { updateTeam } from '@/app/teams/[team]/actions';
import PlayerCombobox from '@/components/PlayerCombobox';
import Link from 'next/link';
import IconBtn from '@/components/commons/IconBtn';

interface Props {
  team: TeamsJoined;
}

export default function TeamDetailsForm({ team }: Props) {
  return (
    <form action={(data) => updateTeam(team.id, data)} className="section flex-row">
      <h2 className="hidden">Team details</h2>
      <div className="flex items-center gap-6">
        <TeamAvatar team={team} />
        <div>
          <div>
            <span className="mr-1">Name:</span>
            <input
              name="name"
              defaultValue={team.name}
              className="input input-bordered input-sm"
              placeholder={team.name}
            />
          </div>
          <div>
            <span className="mr-1">Owner:</span>
            <PlayerCombobox
              defaultValue={team.owner}
              placeholder={team.owner.full_name}
              size="sm"
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
    </form>
  );
}