import { Instance, MatchesJoined, MatchServer } from '@bf2-matchmaking/types';
import { api } from '@bf2-matchmaking/utils';
import RevalidateForm from '@/components/RevalidateForm';
import InstanceTableActionsCell from '@/components/matches-server/InstanceTableActionsCell';
import GenerateServerForm from '@/components/servers/GenerateServerForm';

interface Props {
  match: MatchesJoined;
  matchServer: MatchServer | null;
}

export default async function InstanceSection({ match, matchServer }: Props) {
  const { data: instances } = await api.platform().getServers(match.id);

  const currentInstance = instances?.find(
    (instance) => instance.label === matchServer?.active?.name
  )?.id;

  return (
    <section className="section">
      <div className="flex items-center gap-2">
        <h2>Generated servers</h2>
        <RevalidateForm path={`/matches/${match.id}/server`} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Region</th>
            <th>Status</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {instances?.map((instance, i) => (
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
              <AddressCell instance={instance} />
              <InstanceTableActionsCell
                matchId={match.id}
                instance={instance}
                isCurrentInstance={instance.id === currentInstance}
              />
            </tr>
          ))}
        </tbody>
      </table>
      <GenerateServerForm match={match} />
    </section>
  );
}

async function AddressCell({ instance }: { instance: Instance }) {
  const { data: dns } = await api.platform().getServerDns(instance.main_ip);
  return <td>{dns?.name || instance.main_ip}</td>;
}
