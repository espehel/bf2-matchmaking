'use client';

import { MatchesJoined, MatchServer, ServersRow } from '@bf2-matchmaking/types';
import SelectForm from '@/components/SelectForm';
import { useCallback } from 'react';
import { setServer } from '@/app/matches/[match]/actions';
import { toast } from 'react-toastify';

interface Props {
  match: MatchesJoined;
  matchServer: MatchServer | null;
  servers: Array<ServersRow>;
}

export default function SelectServerForm({ match, matchServer, servers }: Props) {
  const handleSetServer = useCallback(
    async (value: string) => {
      const { error, data } = await setServer(match.id, value);
      if (error) {
        toast.error('Failed to set server');
      } else {
        toast.success(`Changed server to ${data.server?.ip}`);
      }
    },
    [match.id]
  );

  return (
    <SelectForm
      label="Set server"
      options={servers.map(({ ip, name }) => [ip, name])}
      defaultValue={matchServer?.server?.ip}
      action={handleSetServer}
    />
  );
}
