'use client';
import { toast } from 'react-toastify';
import FormSubmitButton from '@/components/FormSubmitButton';
import { createTeam } from '@/app/teams/actions';

export default function TeamCreateForm() {
  const handleFormAction = async (data: FormData) => {
    const { data: team, error } = await createTeam(data);

    if (error) {
      toast.error(error);
    }

    if (team) {
      toast.success(`Added new team ${team.name}`);
    }
  };
  return (
    <form action={handleFormAction} className="form-control grid grid-cols-2 gap-4">
      <div>
        <label className="label" htmlFor="nameInput">
          <span className="label-text">Name</span>
        </label>
        <input className="input input-bordered" name="nameInput" />
      </div>
      <div>
        <label className="label" htmlFor="avatarInput">
          <span className="label-text">Logo url</span>
        </label>
        <input className="input input-bordered" name="avatarInput" />
      </div>
      <FormSubmitButton>Add</FormSubmitButton>
    </form>
  );
}
