'use client';
import { ChangeEvent, Fragment, useCallback, useMemo, useState } from 'react';
import { Combobox } from '@headlessui/react';
import { TeamsRow } from '@bf2-matchmaking/types';
import { supabaseClient } from '@/lib/supabase/supabase-client';
import useSWR from 'swr/mutation';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { CheckIcon } from '@heroicons/react/24/solid';

interface Props {
  onTeamSelected?: (team: TeamsRow | null) => void;
  filterFn?: (team: TeamsRow) => boolean;
  placeholder?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  defaultValue?: TeamsRow;
  name?: string;
}

const searchTeams = (key: string, { arg }: { arg: string }) =>
  supabaseClient().searchTeams(arg).then(verifyResult) as Promise<TeamsRow[]>;

export default function TeamCombobox({
  onTeamSelected,
  placeholder = 'Name',
  size = 'md',
  disabled = false,
  defaultValue,
  name = 'team',
  filterFn,
}: Props) {
  const { data = [], trigger, reset } = useSWR('supabaseSearchPlayers', searchTeams);
  const [selectedTeam, setSelectedTeam] = useState<TeamsRow | null>(defaultValue || null);

  const teams = useMemo(() => {
    if (filterFn) {
      return data.filter(filterFn);
    }
    return data;
  }, [data, filterFn]);

  const handleTeamSelected = useCallback(
    (team: TeamsRow) => {
      setSelectedTeam(team);
      if (onTeamSelected) {
        onTeamSelected(team);
      }
    },
    [onTeamSelected]
  );

  const handleInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.value) {
        await trigger(event.target.value);
      } else {
        reset();
      }
    },
    [trigger, reset]
  );

  return (
    <div className="dropdown">
      <Combobox
        value={selectedTeam}
        onChange={handleTeamSelected}
        nullable
        disabled={disabled}
        name={name}
      >
        <Combobox.Input
          className={`input input-${size} w-full`}
          placeholder={placeholder}
          name="team-select"
          onChange={handleInputChange}
          displayValue={(team: TeamsRow) => team?.name || ''}
        />
        <Combobox.Options className="menu dropdown-content z-[1] shadow bg-base-100 rounded-box p-0 w-full">
          {teams.map((team) => (
            <Combobox.Option key={team.id} value={team} as={Fragment}>
              {({ active, selected }) => (
                <li
                  className={`rounded p-2 ${
                    active
                      ? 'bg-secondary text-secondary-content'
                      : 'bg-base-100 text-base-content'
                  }`}
                >
                  {selected && <CheckIcon className="text-success" />}
                  {team.name}
                </li>
              )}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    </div>
  );
}
