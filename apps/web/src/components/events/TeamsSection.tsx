import AddTeamForm from '@/components/events/AddTeamForm';
import { EventsJoined, TeamsRow } from '@bf2-matchmaking/types';
import IconBtn from '@/components/commons/IconBtn';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { deleteEventTeam } from '@/app/events/[event]/actions';
import ActionWrapper from '@/components/commons/ActionWrapper';

interface Props {
  event: EventsJoined;
}

export default function TeamsSection({ event }: Props) {
  function deleteEventTeamSA(teamId: number) {
    return async () => {
      'use server';
      return deleteEventTeam(event, teamId);
    };
  }

  return (
    <section className="section gap-2">
      <h2>Teams</h2>
      <ul>
        {event.teams.map((team) => (
          <li className="flex items-center" key={team.id}>
            {team.name}
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
      <AddTeamForm eventId={event.id} />
    </section>
  );
}
