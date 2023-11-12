'use client';
import { toast } from 'react-toastify';
import FormSubmitButton from '@/components/FormSubmitButton';
import { generateServer } from '@/app/servers/actions';

export default function GenerateServerForm() {
  const handleFormAction = async (data: FormData) => {
    const { data: server, error } = await generateServer(data);
    if (error) {
      toast.error(error.message);
    }

    if (server) {
      toast.success(`New server is starting up`);
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
        <label className="label" htmlFor="regionInput">
          <span className="label-text">Region</span>
        </label>
        <input className="input input-bordered" name="regionInput" />
      </div>
      <FormSubmitButton>Generate</FormSubmitButton>
    </form>
  );
}
