import { api, verify } from '@bf2-matchmaking/utils';
import JoinMeLink from '@/components/servers/JoinMeLink';
import Link from 'next/link';
import LiveServerSelectAction from '@/components/form/ServerSelect';
import { setGatherServer } from '@/app/gather/actions';
import { GatherStatus } from '@bf2-matchmaking/types/gather';

interface Props {
  configId: number;
  address: string | undefined;
  gatherStatus: GatherStatus;
}

export default async function ServerSection({ configId, address, gatherStatus }: Props) {
  const server = address ? await api.v2.getServer(address).then(verify) : null;

  async function setGatherServerSA(data: FormData) {
    'use server';
    data.append('configId', configId.toString());
    return setGatherServer(data);
  }

  return (
    <section className="section">
      <h2>
        {server ? `Server: ${server.name} - ${server.status}` : 'No server selected'}
      </h2>
      {server && (
        <div className="flex flex-col gap-2">
          {server.matchId && (
            <Link
              className="link link-hover link-accent"
              href={`matches/${server.matchId}`}
            >
              Match {server.matchId}
            </Link>
          )}
          <JoinMeLink server={server} />
        </div>
      )}
      <LiveServerSelectAction
        action={setGatherServerSA}
        defaultServer={address}
        disabled={gatherStatus !== GatherStatus.Queueing}
      />
    </section>
  );
}
