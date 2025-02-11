import { api, verify } from '@bf2-matchmaking/utils';
import { isConnectedLiveServer } from '@bf2-matchmaking/types';
import JoinMeButton from '@/components/servers/JoinMeButton';
import JoinMeLink from '@/components/servers/JoinMeLink';
import Link from 'next/link';
import LiveServerSelectAction from '@/components/form/ServerSelect';
import { setGatherServer } from '@/app/gather/actions';

interface Props {
  address: string | undefined;
}

export default async function ServerSection({ address }: Props) {
  const server = address ? await api.v2.getServer(address).then(verify) : null;
  return (
    <section className="section mt-8">
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
      <LiveServerSelectAction action={setGatherServer} defaultServer={address} />
    </section>
  );
}
