import { createServer } from '@/app/servers/actions';
import FormSubmitButton from '@/components/FormSubmitButton';
import ActionForm from '@/components/commons/ActionForm';

export default function ServerCreateForm() {
  const createServerSA = async (data: FormData) => {
    'use server';
    return createServer(data);
  };

  return (
    <ActionForm
      action={createServerSA}
      successMessage="Added new Server"
      errorMessage="Failed to add server"
      className="form-control grid grid-cols-2 gap-4"
    >
      <div>
        <label className="label" htmlFor="addressInput">
          <span className="label-text">Address</span>
        </label>
        <input className="input input-bordered" name="addressInput" />
      </div>
      <div>
        <label className="label" htmlFor="portInput">
          <span className="label-text">Port</span>
        </label>
        <input className="input input-bordered" name="portInput" />
      </div>
      <div>
        <label className="label" htmlFor="rconPortInput">
          <span className="label-text">Rcon port</span>
        </label>
        <input className="input input-bordered" name="rconPortInput" />
      </div>
      <div>
        <label className="label" htmlFor="rconPwInput">
          <span className="label-text">Rcon password</span>
        </label>
        <input className="input input-bordered" name="rconPwInput" />
      </div>
      <FormSubmitButton>Add</FormSubmitButton>
    </ActionForm>
  );
}
