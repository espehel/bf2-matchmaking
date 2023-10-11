'use client';

import { MatchesJoined, ServersJoined } from '@bf2-matchmaking/types';
import SelectForm from '@/components/SelectForm';
import { useCallback } from 'react';
import { setServer } from '@/app/matches/[match]/actions';
import { toast } from 'react-toastify';

interface Props {
  match: MatchesJoined;
  servers: Array<ServersJoined>;
}

export default function SelectServerForm({ match, servers }: Props) {
  const handleSetServer = useCallback(
    async (value: string) => {
      const { error, data } = await setServer(match.id, value);
      if (error) {
        toast.error('Failed to set server');
      } else {
        toast.success(`Changed server to ${data.server?.name}`);
      }
    },
    [match.id]
  );

  return (
    <SelectForm
      options={servers.map(({ ip, name }) => [ip, name])}
      defaultValue={match.server?.ip}
      action={handleSetServer}
    />
  );
}
