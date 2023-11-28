'use client';

import { MapsRow, RconBf2Server } from '@bf2-matchmaking/types';
import SelectForm from '@/components/SelectForm';
import { useCallback } from 'react';
import { changeServerMap } from '@/app/matches/[match]/actions';
import { toast } from 'react-toastify';

interface Props {
  server: RconBf2Server;
  maps: Array<MapsRow>;
}

export default function ChangeMapForm({ server, maps }: Props) {
  const handleSetServer = useCallback(
    async (value: string) => {
      const { error, data } = await changeServerMap(server.ip, Number(value));
      if (error) {
        toast.error('Failed to change map');
      } else {
        toast.success(`Changing map to ${value}`);
      }
    },
    [server]
  );

  return (
    <SelectForm
      label="Change map"
      options={maps.map(({ id, name }) => [id, name])}
      action={handleSetServer}
    />
  );
}
