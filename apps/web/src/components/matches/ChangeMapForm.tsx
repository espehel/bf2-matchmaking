import SelectActionForm from '@/components/SelectActionForm';
import { changeServerMap } from '@/app/matches/[match]/actions';
import { assertNumber } from '@bf2-matchmaking/utils';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { LiveServer } from '@bf2-matchmaking/types/server';

interface Props {
  server: LiveServer;
}

export default async function ChangeMapForm({ server }: Props) {
  const cookieStore = await cookies();
  const { data: maps } = await supabase(cookieStore).getMaps();

  if (!maps) {
    return null;
  }

  const currentMap = maps.find(
    (map) =>
      map.name.toLocaleLowerCase() === server.live?.currentMapName.replace(/_/g, ' ')
  )?.id;

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
      defaultValue={currentMap}
      successMessage="Changing map"
      errorMessage="Failed to change map"
    />
  );
}
