'use client';
import { createServer } from '@/app/servers/actions';
import { toast } from 'react-toastify';
import FormSubmitButton from '@/components/FormSubmitButton';

export default function ServerCreateForm() {
  const handleFormAction = async (data: FormData) => {
    const { data: server, error } = await createServer(data);

    if (error) {
      toast.error(error);
    }

    if (server) {
      toast.success(`Added new server ${server.ip}`);
    }
  };
  return (
    <form action={handleFormAction} className="form-control grid grid-cols-2 gap-4">
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
    </form>
  );
}
