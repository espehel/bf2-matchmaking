import { createServer } from '@/app/servers/actions';
import FormSubmitButton from '@/components/FormSubmitButton';
import ActionForm from '@/components/form/ActionForm';

export default function ServerCreateForm() {
  return (
    <ActionForm
      action={createServer}
      successMessage="Added new Server"
      errorMessage="Failed to add server"
      className="grid grid-cols-2 gap-4"
    >
      <div>
        <label className="label" htmlFor="addressInput">
          <span className="label-text">Address</span>
        </label>
        <input className="input  ed" name="addressInput" />
      </div>
      <div>
        <label className="label" htmlFor="portInput">
          <span className="label-text">Port</span>
        </label>
        <input className="input  ed" name="portInput" defaultValue={16567} />
      </div>
      <div>
        <label className="label" htmlFor="rconPortInput">
          <span className="label-text">Rcon port</span>
        </label>
        <input className="input  ed" name="rconPortInput" defaultValue={4711} />
      </div>
      <div>
        <label className="label" htmlFor="rconPwInput">
          <span className="label-text">Rcon password</span>
        </label>
        <input className="input  ed" name="rconPwInput" />
      </div>
      <FormSubmitButton>Add</FormSubmitButton>
    </ActionForm>
  );
}
