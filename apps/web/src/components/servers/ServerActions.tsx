import { ServersRow } from '@bf2-matchmaking/types';
import ServerUpdateForm from '@/components/servers/ServerUpdateForm';
import ActionButton from '@/components/ActionButton';
import { deleteServer } from '@/app/servers/[server]/actions';

interface Props {
  server: ServersRow;
}

export default function ServerActions({ server }: Props) {
  async function deleteServerSA() {
    'use server';
    return deleteServer(server.ip);
  }

  return (
    <section className="section">
      <div>
        <ActionButton
          action={deleteServerSA}
          successMessage={`Deleted server ${server.name}`}
          errorMessage={'Failed to delete server'}
          kind="btn-error"
          redirect="/servers"
        >
          Delete server
        </ActionButton>
      </div>
      <ServerUpdateForm server={server} />
    </section>
  );
}
