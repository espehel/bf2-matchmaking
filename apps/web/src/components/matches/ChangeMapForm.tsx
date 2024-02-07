import { LiveServer } from '@bf2-matchmaking/types';
import SelectActionForm from '@/components/SelectActionForm';
import { changeServerMap } from '@/app/matches/[match]/actions';
import { assertNumber } from '@bf2-matchmaking/utils';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {
  server: LiveServer;
}

export default async function ChangeMapForm({ server }: Props) {
  const { data: maps } = await supabase(cookies).getMaps();

  if (!maps) {
    return null;
  }

  async function changeServerMapSA(data: FormData) {
    'use server';
    const value = Number(data.get('select'));
    assertNumber(value, 'No map selected');
    return changeServerMap(server.address, value);
  }

  return (
    <SelectActionForm
      label="Change map"
      options={maps.map(({ id, name }) => [id, name])}
      action={changeServerMapSA}
      successMessage="Changing map"
      errorMessage="Failed to change map"
    />
  );
}
