import { getConnections, hello } from '@bf2-matchmaking/redis/generic';
import StatusCollapse from '@/components/admin/StatusCollapse';
import ActionButton from '@/components/ActionButton';
import { resetSystem } from '@/app/admin/actions';
import { api, engine } from '@bf2-matchmaking/utils';
import { json } from '@bf2-matchmaking/redis/json';
import { hash } from '@bf2-matchmaking/redis/hash';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const redis = await hello().catch(() => null);
  const connections = await getConnections().catch(() => null);
  const apiHealth = await api.v2.getHealth();
  const engineHealth = await engine.getHealth();
  const engineState = await json('app:engine:state')
    .get()
    .catch(() => null);
  const systemState = await hash('system')
    .getAll()
    .catch(() => null);
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();

  return (
    <main className="main">
      <section className="section mb-8">
        <h2>System</h2>
        <p>{`Last reset: ${systemState?.resetAt}`}</p>
        <ActionButton
          action={resetSystem}
          successMessage="System reset, services restarting..."
          errorMessage="Failed to reset system"
          disabled={!adminRoles?.system_admin}
        >
          Reset
        </ActionButton>
      </section>
      <section className="section">
        <h2>Status</h2>
        <StatusCollapse ok={Boolean(apiHealth)} title="Api">
          <p>{`Running since: ${systemState?.apiStartedAt}`}</p>
        </StatusCollapse>
        <StatusCollapse ok={Boolean(engineHealth)} title="Engine">
          <p>{`Running since: ${systemState?.engineStartedAt}`}</p>
          {JSON.stringify(engineState)}
        </StatusCollapse>
        <StatusCollapse ok={Boolean(redis)} title="Redis">
          {redis && connections && (
            <div className="flex flex-col">
              <div className="overflow-auto">
                {Object.entries(redis).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-bold">{key}</span>: {value}
                  </div>
                ))}
              </div>
              <div className="overflow-auto">
                {connections.length && (
                  <div className="max-w-[1000px] w-fit max-h-[300px]">
                    <table className="table">
                      <thead>
                        <tr>
                          {Object.keys(connections[0]).map((key) => (
                            <th key={key}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {connections.map((connection) => (
                          <tr key={connection.id}>
                            {Object.entries(connection).map(([key, value]) => (
                              <td key={key}>{value}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </StatusCollapse>
      </section>
    </main>
  );
}
