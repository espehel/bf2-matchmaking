'use client';
import { SyntheticEvent, useCallback, useMemo, useState } from 'react';
import { ServersRow } from '@bf2-matchmaking/types';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { sortByName } from '@bf2-matchmaking/utils';
import { log } from 'node:util';

interface Props {
  servers: Array<ServersRow>;
}

export default function ServerMultiSelect({ servers }: Props) {
  const [selectedServers, setSelectedServers] = useState<Array<ServersRow>>([]);

  const sortedServers = useMemo(() => sortByName(servers), [servers]);
  const visibleServers = useMemo(
    () => sortedServers.filter((s) => !selectedServers.includes(s)),
    [sortedServers, selectedServers]
  );

  const handleServerSelected = useCallback(
    (e: SyntheticEvent<HTMLSelectElement, Event>) => {
      const server = servers.find((server) => server.ip === e.currentTarget.value);
      if (!server) {
        return;
      }
      setSelectedServers((prevState) => [...prevState, server]);
    },
    [servers]
  );

  return (
    <div>
      <label className="label" htmlFor="serverSelect">
        <span className="label-text inline-flex items-center">Server selection</span>
      </label>
      <div>
        {selectedServers.map((server, i) => (
          <input
            key={server.ip}
            className="hidden"
            name={`serverSelect[${i}]`}
            value={server.ip}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {selectedServers.map((server) => (
            <button
              key={server.ip}
              onClick={() =>
                setSelectedServers(selectedServers.filter((s) => s.ip !== server.ip))
              }
              className="badge badge-info"
            >
              <XMarkIcon className="size-4" />
              <p>{server.name}</p>
            </button>
          ))}
        </div>
        <select
          className="select  ed w-full"
          id="serverSelect"
          onChange={handleServerSelected}
          onSelect={handleServerSelected}
          value={undefined}
        >
          <option>Select a server</option>
          {visibleServers.map((server) => (
            <option key={server.ip} value={server.ip}>
              {server.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
