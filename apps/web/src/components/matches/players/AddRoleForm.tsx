import InputField from '@/components/form/fields/InputField';
import SelectField from '@/components/form/fields/SelectField';
import { publicMatchRoleSchema } from '@bf2-matchmaking/schemas';
import ActionForm from '@/components/commons/action/ActionForm';
import SubmitActionFormButton from '@/components/form/SubmitActionFormButton';
import { addMatchRole } from '@/app/matches/[match]/actions';

interface Props {
  matchId: number;
}

export default function AddRoleForm({ matchId }: Props) {
  return (
    <ActionForm
      action={addMatchRole}
      extras={{ matchId: matchId.toString() }}
      className="join w-md"
    >
      <SelectField
        name="role"
        className="join-item"
        placeholder="Role"
        options={publicMatchRoleSchema.options.map((o) => o.value)}
      />
      <InputField name="count" type="number" className="join-item" placeholder="Count" />
      <InputField
        name="priority"
        type="number"
        className="join-item"
        placeholder="Priority"
      />
      <SubmitActionFormButton kind="secondary" className="join-item">
        Add
      </SubmitActionFormButton>
    </ActionForm>
  );
}
