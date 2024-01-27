import Select from '@/components/commons/Select';
import React from 'react';
import { MapsRow } from '@bf2-matchmaking/types';

interface Props {
  maps: Array<MapsRow>;
  optionKey?: 'id' | 'name';
}

export default async function MapsSelect({ maps, optionKey = 'id' }: Props) {
  const options = (
    maps.map(({ id, name }) => [optionKey === 'id' ? id : name, name]) as Array<
      [number | string, string]
    >
  ).sort(([, a], [, b]) => a.localeCompare(b));

  const defaultValue = optionKey === 'id' ? 1 : 'Strike at Karkand';

  return (
    <Select label="Map" name="mapInput" defaultValue={defaultValue} options={options} />
  );
}
