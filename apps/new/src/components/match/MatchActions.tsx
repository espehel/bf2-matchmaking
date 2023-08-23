'use client';
import { MatchesJoined, MatchStatus, ServersJoined } from '@bf2-matchmaking/types';
import { closeMatch, setServer } from '@/app/matches/[match]/actions';
import { toast } from 'react-toastify';
import { useCallback } from 'react';
import SelectForm from '@/components/SelectForm';

interface Props {
  match: MatchesJoined;
  servers: Array<ServersJoined> | null;
}

export default function MatchActions({ match, servers }: Props) {
  const handleCloseMatch = useCallback(async () => {
    const { error } = await closeMatch(match.id);
    if (error) {
      toast.error('Failed to close match.');
    } else {
      toast.success(`Match ${match.id} closed.`);
    }
  }, [match]);

  const handleSetServer = useCallback(async (value: string) => {
    const { error, data } = await setServer(match.id, value);
    if (error) {
      toast.error('Failed to set server');
    } else {
      toast.success(`Changed server to ${data.server?.name}`);
    }
  }, []);

  if (match.status === MatchStatus.Closed) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <button className="btn btn-primary w-fit" onClick={handleCloseMatch}>
        Close match
      </button>
      {servers && (
        <SelectForm
          options={servers.map(({ ip, name }) => [ip, name])}
          defaultValue={match.server?.ip}
          action={handleSetServer}
        />
      )}
    </div>
  );
}
