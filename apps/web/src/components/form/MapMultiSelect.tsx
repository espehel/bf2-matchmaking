'use client';
import { SyntheticEvent, useCallback, useMemo, useState } from 'react';
import { MapsRow } from '@bf2-matchmaking/types';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { sortByName } from '@bf2-matchmaking/utils';

interface Props {
  maps: Array<MapsRow>;
  defaultMaps?: Array<MapsRow>;
}

export default function MapMultiSelect({ maps, defaultMaps = [] }: Props) {
  const [selectedMaps, setSelectedMaps] = useState<Array<MapsRow>>(defaultMaps);

  const sortedMaps = useMemo(() => sortByName(maps), [maps]);
  const visibleMaps = useMemo(
    () => sortedMaps.filter((s) => !selectedMaps.includes(s)),
    [sortedMaps, selectedMaps]
  );

  const handleMapSelected = useCallback(
    (e: SyntheticEvent<HTMLSelectElement, Event>) => {
      const map = maps.find((map) => map.id.toString() === e.currentTarget.value);
      if (!map) {
        return;
      }
      setSelectedMaps((prevState) => [...prevState, map]);
    },
    [maps]
  );

  return (
    <div>
      <label className="label" htmlFor="mapSelect">
        <span className="label-text inline-flex items-center">Map selection</span>
      </label>
      <div>
        {selectedMaps.map((map, i) => (
          <input
            key={map.id}
            className="hidden"
            name={`mapSelect[${i}]`}
            value={map.id}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {selectedMaps.map((map) => (
            <button
              key={map.id}
              onClick={() => setSelectedMaps(selectedMaps.filter((s) => s.id !== map.id))}
              className="badge badge-info"
            >
              <XMarkIcon className="size-4" />
              <p>{map.name}</p>
            </button>
          ))}
        </div>
        <select
          className="select  ed w-full"
          id="mapSelect"
          onChange={handleMapSelected}
          onSelect={handleMapSelected}
          value={undefined}
        >
          <option>Select a map</option>
          {visibleMaps.map((map) => (
            <option key={map.id} value={map.id}>
              {map.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
