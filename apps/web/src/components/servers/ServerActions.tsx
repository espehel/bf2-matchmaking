import { ServersRow } from '@bf2-matchmaking/types';
import ServerUpdateForm from '@/components/servers/ServerUpdateForm';
import AsyncActionButton from '@/components/AsyncActionButton';
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
        <AsyncActionButton
          action={deleteServerSA}
          successMessage={`Deleted server ${server.name}`}
          errorMessage={'Failed to delete server'}
          kind="btn-error"
          redirect="/servers"
        >
          Delete server
        </AsyncActionButton>
      </div>
      <ServerUpdateForm server={server} />
    </section>
  );
}
