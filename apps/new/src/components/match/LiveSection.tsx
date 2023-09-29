import {
  MatchesJoined,
  MatchStatus,
  PlayerListItem,
  ServerInfo,
} from '@bf2-matchmaking/types';
import { api } from '@bf2-matchmaking/utils';
import RoundTable from '@/components/RoundTable';
import AsyncActionButton from '@/components/AsyncActionButton';

interface Props {
  match: MatchesJoined;
  isMatchAdmin: boolean;
}
export default async function LiveSection({ match, isMatchAdmin }: Props) {
  const { data } = await api.rcon().getMatchLive(match.id);

  if (!data || match.status !== MatchStatus.Ongoing) {
    return null;
  }

  const { round, status } = data;
  const serverInfo = round?.si;
  const playerList = round?.pl;

  const serverChanged = match.server?.ip !== data.round?.server;

  async function startPolling() {
    'use server';
    return api.rcon().postMatchLive(match.id, false);
  }

  return (
    <section className="section w-full">
      <h2>Live</h2>
      <p>{`Status: ${status || 'not connected'}`}</p>
      {serverInfo && playerList && (
        <RoundTable serverInfo={serverInfo!} playerList={playerList!} />
      )}
      {!status && (
        <div>
          <p>Match is not polling data from server</p>
          {isMatchAdmin && (
            <AsyncActionButton
              action={startPolling}
              successMessage="Match started polling data"
              errorMessage="Failed to start polling data"
            >
              Connect
            </AsyncActionButton>
          )}
        </div>
      )}
      {serverChanged && (
        <div>
          <p>Match is polling from wrong server</p>
          {isMatchAdmin && (
            <AsyncActionButton
              action={startPolling}
              successMessage="Match started polling data"
              errorMessage="Failed to start polling data"
            >
              Reconnect
            </AsyncActionButton>
          )}
        </div>
      )}
    </section>
  );
}
