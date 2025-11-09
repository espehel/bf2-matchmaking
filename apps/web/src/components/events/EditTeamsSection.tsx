import AddTeamForm from '@/components/events/AddTeamForm';
import { EventsJoined } from '@bf2-matchmaking/types';
import IconBtn from '@/components/commons/IconBtn';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { deleteEventTeam, setEventOpen } from '@/app/events/[event]/actions';
import ActionWrapper from '@/components/commons/ActionWrapper';
import Link from 'next/link';
import ToggleAction from '@/components/form/ToggleAction';
import { TeamsSelect } from '@/components/TeamsSelect';

interface Props {
  event: EventsJoined;
}

export default function EditTeamsSection({ event }: Props) {
  function deleteEventTeamSA(teamId: number) {
    return async () => {
      'use server';
      return deleteEventTeam(event, teamId);
    };
  }

  return (
    <section className="section gap-2 col-span-2">
      <div className="flex gap-8 items-center justify-between">
        <h2>Teams</h2>
        <ToggleAction
          name="open"
          label="Allow sign ups"
          action={setEventOpen}
          successMessage={event.open ? 'Sign ups closed' : 'Sign ups open'}
          errorMessage="Failed to update sign ups"
          extras={{ event: event.id.toString() }}
          defaultChecked={event.open}
        />
      </div>
      <ul>
        {event.teams.map((team) => (
          <li className="flex items-center gap-1 text-lg" key={team.id}>
            <Link className="link link-hover" href={`/teams/${team.id}`}>
              {team.name}
            </Link>
            <ActionWrapper
              action={deleteEventTeamSA(team.id)}
              successMessage="Team deleted"
              errorMessage="Failed to delete team"
            >
              <IconBtn Icon={XCircleIcon} size="xs" className="text-error" />
            </ActionWrapper>
          </li>
        ))}
      </ul>
      <AddTeamForm eventId={event.id} edit={true} open={event.open} />
    </section>
  );
}
