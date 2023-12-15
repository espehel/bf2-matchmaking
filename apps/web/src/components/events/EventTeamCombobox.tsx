'use client';

import TeamCombobox from '@/components/TeamCombobox';
import { useCallback } from 'react';
import { TeamsRow } from '@bf2-matchmaking/types';

interface Props {
  name: string;
  placeholder: string;
  teams: Array<number>;
}

export default function EventTeamCombobox({ name, placeholder, teams }: Props) {
  const filterFn = useCallback((team: TeamsRow) => teams.includes(team.id), [teams]);
  return (
    <TeamCombobox name={name} placeholder={placeholder} size="sm" filterFn={filterFn} />
  );
}
