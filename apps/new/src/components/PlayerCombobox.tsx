'use client';
import { ChangeEvent, Fragment, useCallback, useEffect, useState } from 'react';
import { Combobox } from '@headlessui/react';
import { PlayersRow } from '@bf2-matchmaking/types';
import { supabaseClient } from '@/lib/supabase-client';
import useSWR from 'swr/mutation';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { CheckIcon } from '@heroicons/react/24/solid';

interface Props {
  onPlayerSelected?: (player: PlayersRow | null) => void;
}

const searchPlayers = (key: string, { arg }: { arg: string }) =>
  supabaseClient().searchPlayers(arg).then(verifyResult) as Promise<PlayersRow[]>;

export default function PlayerCombobox({ onPlayerSelected }: Props) {
  const {
    data: players = [],
    trigger,
    reset,
  } = useSWR('supabaseSearchPlayers', searchPlayers);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayersRow | null>(null);

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
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.value) {
        trigger(event.target.value);
      } else {
        reset();
      }
    },
    [trigger, reset]
  );

  return (
    <div className="dropdown">
      <Combobox value={selectedPlayer} onChange={handlePlayerSelected} nullable>
        <Combobox.Input
          className="input"
          placeholder="Name"
          onChange={handleInputChange}
          displayValue={(player: PlayersRow) => player?.full_name || ''}
        />
        <Combobox.Options className="menu dropdown-content z-[1] shadow bg-base-100 rounded-box p-0 w-52">
          {players.map((player) => (
            <Combobox.Option key={player.id} value={player} as={Fragment}>
              {({ active, selected }) => (
                <li
                  className={`rounded p-2 ${
                    active
                      ? 'bg-secondary text-secondary-content'
                      : 'bg-base-100 text-base-content'
                  }`}
                >
                  {selected && <CheckIcon className="text-success" />}
                  {player.full_name}
                </li>
              )}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    </div>
  );
}