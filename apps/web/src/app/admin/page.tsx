import { getConnections, hello } from '@bf2-matchmaking/redis/generic';

export default async function AdminPage() {
  const redis = await hello();
  const connections = await getConnections();
  return (
    <main className="main">
      <section className="section">
        <h2>Redis status</h2>
        {Object.entries(redis).map(([key, value]) => (
          <div key={key}>
            <span className="font-bold">{key}</span>: {value}
          </div>
        ))}
        {connections.length && (
          <div className="overflow-auto">
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
      </section>
    </main>
  );
}
