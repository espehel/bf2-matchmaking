'use client';
import FormSubmitButton from '@/components/FormSubmitButton';
import { createTeam } from '@/app/teams/actions';
import ActionForm from '@/components/form/ActionForm';

export default function TeamCreateForm() {
  return (
    <ActionForm
      formAction={createTeam}
      successMessage="Added new team"
      errorMessage="Failed to add team"
      className=" flex flex-col gap-4"
    >
      <div>
        <label className="label" htmlFor="nameInput">
          <span className="label-text">Name</span>
        </label>
        <input className="input" name="nameInput" />
      </div>
      <div>
        <label className="label" htmlFor="avatarInput">
          <span className="label-text">Logo url</span>
        </label>
        <input className="input" name="avatarInput" />
      </div>
      <FormSubmitButton>Add</FormSubmitButton>
    </ActionForm>
  );
}
