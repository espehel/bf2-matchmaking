'use client';

import { MatchesJoined, ServersRow } from '@bf2-matchmaking/types';
import SelectForm from '@/components/SelectForm';
import { useCallback } from 'react';
import { setServer } from '@/app/matches/[match]/actions';
import { toast } from 'react-toastify';

interface Props {
  match: MatchesJoined;
  servers: Array<ServersRow>;
}

export default function SelectServerForm({ match, servers }: Props) {
  const handleSetServer = useCallback(
    async (value: string) => {
      const { error, data } = await setServer(match.id, value);
      if (error) {
        toast.error('Failed to set server');
      } else {
        toast.success(`Changed server to ${data.ip}`);
      }
    },
    [match.id]
  );

  return (
    <SelectForm
      label="Set server"
      options={servers.map(({ ip, name }) => [ip, name])}
      defaultValue={match.server?.ip}
      action={handleSetServer}
    />
  );
}
