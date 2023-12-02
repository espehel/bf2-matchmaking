'use client';
import { Region, ServersRow } from '@bf2-matchmaking/types';
import Select from '@/components/commons/Select';
import React, { useState } from 'react';

interface Props {
  servers: Array<ServersRow>;
  regions: Array<Region> | null;
}

export default function MatchServerSelect({ servers, regions }: Props) {
  const [generate, setGenerate] = useState(Boolean(regions));
  return (
    <div>
      <label className="label cursor-pointer justify-start gap-2">
        <span className="label-text">Generate server</span>
        <input
          type="checkbox"
          className="toggle toggle-info"
          checked={generate}
          onChange={() => setGenerate(!generate)}
          disabled={!regions}
        />
      </label>
      {generate && regions ? (
        <Select
          label="Region"
          name="regionSelect"
          options={regions.map(({ id, city, country }) => [id, `${city}, ${country}`])}
        />
      ) : (
        <Select
          label="Server"
          name="serverSelect"
          placeholder="No server set"
          options={servers.map(({ ip, name }) => [ip, name])}
        />
      )}
    </div>
  );
}
