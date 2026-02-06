import { changeServerMap } from '@/app/matches/[match]/actions';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { LiveServer } from '@bf2-matchmaking/types/server';
import SelectActionForm from '@/components/commons/action/SelectActionForm';

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

  return (
    <SelectActionForm
      label="Change map"
      name="mapId"
      options={maps.map<[number, string]>(({ id, name }) => [id, name])}
      action={changeServerMap}
      defaultValue={currentMap}
      extras={{ address: server.address }}
      kind="secondary"
    />
  );
}
