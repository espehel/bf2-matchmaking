import AddTeamForm from '@/components/events/AddTeamForm';
import { EventsJoined } from '@bf2-matchmaking/types';
import IconBtn from '@/components/commons/IconBtn';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { deleteEventTeam } from '@/app/events/[event]/actions';
import ActionWrapper from '@/components/commons/ActionWrapper';
import Link from 'next/link';

interface Props {
  event: EventsJoined;
  edit: boolean;
}

export default function TeamsSection({ event, edit }: Props) {
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
          <li className="flex items-center gap-1 text-lg" key={team.id}>
            <Link className="link link-hover" href={`/teams/${team.id}`}>
              {team.name}
            </Link>
            <ActionWrapper
              action={deleteEventTeamSA(team.id)}
              successMessage="Team deleted"
              errorMessage="Failed to delete team"
              visible={edit}
            >
              <IconBtn Icon={XCircleIcon} size="xs" className="text-error" />
            </ActionWrapper>
          </li>
        ))}
      </ul>
      {edit && <AddTeamForm eventId={event.id} />}
    </section>
  );
}
