'use client';
import {
  GetMatchLiveResponseBody,
  MatchesJoined,
  MatchStatus,
} from '@bf2-matchmaking/types';
import RoundTable from '@/components/RoundTable';
import AsyncActionButton from '@/components/AsyncActionButton';
import { startPolling } from '@/app/matches/[match]/actions';

interface Props {
  match: MatchesJoined;
  isMatchAdmin: boolean;
  data: GetMatchLiveResponseBody | null;
}
export default function LiveSection({ match, isMatchAdmin, data }: Props) {
  if (!data || match.status !== MatchStatus.Ongoing) {
    return null;
  }

  const { round, status } = data;
  const serverInfo = round?.si;
  const playerList = round?.pl;

  const serverChanged = match.server?.ip !== data.round?.server;

  // TODO: rework this. should be client component or move async buttons to client component
  return (
    <section className="section bg-secondary text-secondary-content w-full">
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
              action={() => startPolling(match.id)}
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
              action={() => startPolling(match.id)}
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
