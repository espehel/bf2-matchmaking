'use client';
import { ChangeEvent, Fragment, useCallback, useState } from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import { PlayersRow } from '@bf2-matchmaking/types';
import { supabaseClient } from '@/lib/supabase/supabase-client';
import useSWR from 'swr/mutation';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { CheckIcon } from '@heroicons/react/24/solid';

interface Props {
  onPlayerSelected?: (player: PlayersRow | null) => void;
  placeholder?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  defaultValue?: PlayersRow;
}

const searchPlayers = (key: string, { arg }: { arg: string }) =>
  supabaseClient()
    .searchPlayers(arg.replace(/_/g, '\\_').replace(/%/g, '\\%'))
    .then(verifyResult) as Promise<PlayersRow[]>;

export default function PlayerCombobox({
  onPlayerSelected,
  placeholder = 'Name',
  size = 'md',
  disabled = false,
  defaultValue,
}: Props) {
  const {
    data: players = [],
    trigger,
    reset,
  } = useSWR('supabaseSearchPlayers', searchPlayers);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayersRow | null>(
    defaultValue || null
  );

  const handlePlayerSelected = useCallback(
    (player: PlayersRow) => {
      setSelectedPlayer(player);
      if (onPlayerSelected) {
        onPlayerSelected(player);
      }
    },
    [onPlayerSelected]
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
        value={selectedPlayer}
        onChange={handlePlayerSelected}
        disabled={disabled}
        name="player"
      >
        <ComboboxInput
          className={`input  ed input-${size} w-full`}
          placeholder={placeholder}
          name="player-select"
          onChange={handleInputChange}
          displayValue={(player: PlayersRow) => player?.nick || ''}
        />
        <ComboboxOptions className="menu dropdown-content z-[1] shadow bg-base-100 rounded-box p-0 w-full">
          {players.map((player) => (
            <ComboboxOption key={player.id} value={player} as={Fragment}>
              {({ focus, selected }) => (
                <li
                  className={`rounded p-2 ${
                    focus
                      ? 'bg-secondary text-secondary-content'
                      : 'bg-base-100 text-base-content'
                  }`}
                >
                  {selected && <CheckIcon className="text-success" />}
                  {player.nick}
                </li>
              )}
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
