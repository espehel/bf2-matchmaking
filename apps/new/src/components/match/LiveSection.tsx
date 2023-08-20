import { MatchesJoined, PlayerListItem, ServerInfo } from '@bf2-matchmaking/types';
import { api } from '@bf2-matchmaking/utils';
import RoundTable from '@/components/RoundTable';
import AsyncActionButton from '@/components/AsyncActionButton';

interface Props {
  match: MatchesJoined;
  isMatchAdmin: boolean;
}
export default async function LiveSection({ match, isMatchAdmin }: Props) {
  const { data } = await api.rcon().getMatchLive(match.id);

  if (!data) {
    return null;
  }

  const { round, status } = data;
  const serverInfo: ServerInfo =
    typeof round?.si === 'string' ? JSON.parse(round.si) : null;
  const playerList: Array<PlayerListItem> =
    typeof round?.pl === 'string' ? JSON.parse(round.pl) : null;

  async function startPolling() {
    'use server';
    return api.rcon().postMatchPoll(match.id);
  }

  return (
    <section>
      <h2>Live</h2>
      <p>{`Status: ${status || 'not connected'}`}</p>
      {serverInfo && playerList && (
        <RoundTable serverInfo={serverInfo} playerList={playerList} />
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
    </section>
  );
}
