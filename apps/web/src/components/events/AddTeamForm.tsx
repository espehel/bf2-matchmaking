import ActionForm from '@/components/form/ActionForm';
import { addEventTeam } from '@/app/events/[event]/actions';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import TeamCombobox from '@/components/TeamCombobox';
import TransitionWrapper from '@/components/commons/TransitionWrapper';
import IconBtn from '@/components/commons/IconBtn';
import { TeamsSelect } from '@/components/TeamsSelect';
import { ArrowRightIcon } from '@heroicons/react/16/solid';

interface Props {
  eventId: number;
  edit: boolean;
  open: boolean;
}

export default function AddTeamForm({ eventId, edit, open }: Props) {
  if (edit) {
    return (
      <ActionForm
        action={addEventTeam}
        successMessage="Successfully added team"
        errorMessage="Failed to add team"
        extras={{ event: eventId.toString() }}
      >
        <div className="flex gap-2 items-center">
          <TeamCombobox size="sm" />
          <TransitionWrapper>
            <IconBtn
              type="submit"
              Icon={edit ? PlusCircleIcon : ArrowRightIcon}
              size="sm"
              className="text-success"
            />
          </TransitionWrapper>
        </div>
      </ActionForm>
    );
  }
  if (open) {
    return (
      <ActionForm
        action={addEventTeam}
        successMessage="Successfully added team"
        errorMessage="Failed to add team"
        extras={{ event: eventId.toString() }}
      >
        <div className="divider" />
        <div className="flex gap-2 items-end">
          <TeamsSelect
            name="team[id]"
            label="Choose"
            filter="captain"
            size="sm"
            placeholder="Your team"
          />
          <TransitionWrapper>
            <button className="btn btn-secondary btn-sm">Join</button>
          </TransitionWrapper>
        </div>
      </ActionForm>
    );
  }
  return null;
}
