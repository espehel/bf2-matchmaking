import { MatchesJoined } from '@bf2-matchmaking/types';
import { Instance } from '@bf2-matchmaking/types/platform';
import { api } from '@bf2-matchmaking/utils';
import RevalidateForm from '@/components/RevalidateForm';
import InstanceTableActionsCell from '@/components/matches-server/InstanceTableActionsCell';
import GenerateServerForm from '@/components/matches-server/GenerateServerForm';
import { Suspense } from 'react';

interface Props {
  match: MatchesJoined;
}

export default async function ServerInstancesSection({ match }: Props) {
  const { data: instances } = await api.platform().getServers(match.id);

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
            <tr key={instance.id}>
              <td>{i + 1}</td>
              <td>{instance.label}</td>
              <td>{instance.region}</td>
              <td>{instance.status}</td>
              <Suspense fallback={<td></td>}>
                <AddressCell instance={instance} />
              </Suspense>
              <Suspense fallback={<td></td>}>
                <InstanceTableActionsCell matchId={match.id} instance={instance} />
              </Suspense>
            </tr>
          ))}
        </tbody>
      </table>
      {(!instances || instances.length === 0) && <div>No server instances created</div>}
      <Suspense fallback={null}>
        <GenerateServerForm match={match} hasInstance={Boolean(instances?.length)} />
      </Suspense>
    </section>
  );
}

async function AddressCell({ instance }: { instance: Instance }) {
  const { data: dns } = await api.platform().getServerDns(instance.main_ip);
  return <td>{dns?.name || instance.main_ip}</td>;
}
