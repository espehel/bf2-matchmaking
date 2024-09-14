import React from 'react';
import { Region } from '@bf2-matchmaking/types/platform';
import Select from '@/components/commons/Select';

interface Props {
  regions: Array<Region>;
}

export default async function RegionSelect({ regions }: Props) {
  const options = regions
    .map(({ id, city, country }) => [id, `${city}, ${country}`])
    .sort(([, a], [, b]) => a.localeCompare(b)) as Array<[string, string]>;
  return <Select label="Region" name="regionInput" options={options} />;
}
