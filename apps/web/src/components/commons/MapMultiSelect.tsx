'use client';
import { MapsRow } from '@bf2-matchmaking/types';
import { Listbox } from '@headlessui/react';
import { useCallback } from 'react';

interface Props {
  maps: Array<MapsRow>;
}

export default function MapMultiSelect({ maps }: Props) {
  const toMapName = useCallback(
    (id: number) => maps.find((map) => map.id === id)?.name,
    [maps]
  );

  const sortedMaps = [...maps].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="dropdown dropdown-bottom min-w-[360px] w-fit">
      <label className="label" htmlFor="mapsSelect">
        <span className="label-text">Maps</span>
      </label>
      <Listbox name="mapsSelect" multiple>
        <Listbox.Button className="input input-bordered input-md w-full text-left font-bold">
          {({ value }) =>
            value.length ? value.map(toMapName).join(', ') : 'Select maps'
          }
        </Listbox.Button>
        <Listbox.Options className="menu dropdown-content z-[1] shadow bg-base-100 border border-1 rounded-box p-0 w-full max-h-[200px]">
          {sortedMaps.map((map) => (
            <Listbox.Option
              className="m-1 p-1.5 text-md text-left rounded cursor-pointer ui-active:bg-accent ui-active:text-accent-content ui-selected:bg-primary ui-selected:text-primary-content"
              key={map.id}
              value={map.id}
            >
              {map.name}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </Listbox>
    </div>
  );
}
