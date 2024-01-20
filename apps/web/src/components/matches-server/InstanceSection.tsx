import { MatchServer } from '@bf2-matchmaking/types';
import { api } from '@bf2-matchmaking/utils';
import IconBtn from '@/components/commons/IconBtn';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { ArrowRightCircleIcon } from '@heroicons/react/24/solid';

interface Props {
  matchId: number;
  matchServer: MatchServer | null;
}

export default async function InstanceSection({ matchId, matchServer }: Props) {
  const { data: instances } = await api.platform().getServers(matchId);
  if (!instances || instances.length === 0) {
    return null;
  }
  const currentInstance = matchServer?.instance;
  return (
    <section className="section">
      <h2>Generated servers</h2>
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Region</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {instances.map((instance, i) => (
            <tr
              key={instance.id}
              className={
                instance.id === currentInstance ? 'bg-info text-info-content' : ''
              }
            >
              <td>{i + 1}</td>
              <td>{instance.label}</td>
              <td>{instance.region}</td>
              <td>{instance.status}</td>
              <td>
                <IconBtn Icon={XCircleIcon} />
                {instance.id !== currentInstance && (
                  <IconBtn Icon={ArrowRightCircleIcon} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
