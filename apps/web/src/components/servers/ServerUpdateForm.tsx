'use client';
import { ServersRow } from '@bf2-matchmaking/types';
import { updateServer } from '@/app/servers/[server]/actions';
import { toast } from 'react-toastify';
import FormSubmitButton from '@/components/FormSubmitButton';

interface Props {
  server: ServersRow;
}

export default function ServerUpdateForm({ server }: Props) {
  const handleFormAction = async (data: FormData) => {
    const result = await updateServer(server.ip, data);
    if (result.ok) {
      toast.success(`Successfully updated server ${server.ip}`);
    } else {
      toast.error(`Failed to update server ${server.ip}`);
    }
  };

  return (
    <form action={handleFormAction} className="form-control">
      <label className="label" htmlFor="demosInput">
        Demos:
      </label>
      <input
        className="input input-bordered"
        name="demosInput"
        defaultValue={server.demos_path || undefined}
      />
      <label className="label" htmlFor="portInput">
        Port:
      </label>
      <input
        className="input input-bordered"
        name="portInput"
        defaultValue={server.port}
      />
      <label className="label" htmlFor="rconPortInput">
        Rcon port:
      </label>
      <input className="input input-bordered" name="rconPortInput" placeholder="*****" />
      <label className="label" htmlFor="rconPwInput">
        Rcon password:
      </label>
      <input
        className="input input-bordered mb-2"
        name="rconPwInput"
        placeholder="*****"
      />
      <FormSubmitButton>Update</FormSubmitButton>
    </form>
  );
}
