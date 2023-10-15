'use client';
import { MapsRow, MatchesJoined } from '@bf2-matchmaking/types';
import { useCallback, useState } from 'react';
import { setMaps } from '@/app/matches/[match]/actions';
import { toast } from 'react-toastify';
import { Listbox } from '@headlessui/react';

interface Props {
  match: MatchesJoined;
  maps: Array<MapsRow>;
}

export default function MatchMapsSelect({ match, maps }: Props) {
  const [selectedMaps, setSelectedMaps] = useState<Array<number>>(
    match.maps.map((map) => map.id)
  );
  const handleSetMaps = useCallback(async () => {
    const { error, data } = await setMaps(match.id, selectedMaps);
    if (error) {
      toast.error('Failed to set maps');
    } else {
      toast.success(`Set ${data.length} maps`);
    }
  }, [match.id, selectedMaps]);

  return (
    <div className="flex gap-2">
      <div className="dropdown dropdown-top min-w-[360px]">
        <Listbox value={selectedMaps} onChange={setSelectedMaps} multiple>
          <Listbox.Button className="input input-bordered input-md w-full text-left font-bold">{`${selectedMaps.length} maps`}</Listbox.Button>
          <Listbox.Options className="menu dropdown-content z-[1] shadow bg-base-100 border border-1 rounded-box p-0 w-full">
            {maps.map((map) => (
              <Listbox.Option
                className="p-1.5 text-md text-left ui-active:bg-accent ui-active:text-accent-content ui-selected:bg-primary ui-selected:text-primary-content"
                key={map.id}
                value={map.id}
              >
                {map.name}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Listbox>
      </div>
      <button
        className="btn btn-primary"
        onClick={handleSetMaps}
      >{`Set ${selectedMaps.length} maps`}</button>
    </div>
  );
}
