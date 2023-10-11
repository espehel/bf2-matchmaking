import React, { FC, Fragment, useCallback, useMemo, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { HiCheck, HiChevronUpDown } from 'react-icons/hi2';
import { useFetcher } from '@remix-run/react';
import { MatchesJoined, PlayersRow } from '@bf2-matchmaking/types';
import ActionForm from '~/components/form/ActionForm';

interface Props {
  match: MatchesJoined;
}
const AddPlayerForm: FC<Props> = ({ match }) => {
  const [selected, setSelected] = useState<string>();
  const [query, setQuery] = useState('');
  const { data, load } = useFetcher<{ players: Array<PlayersRow> }>();

  const handleComboFocus = useCallback(() => {
    if (!data) {
      load('/players?index');
    }
  }, []);

  const handleComboboxChange = (playerId: string) => {
    const username =
      data?.players.find((player) => player.id === playerId)?.username || 'Select player';
    setSelected(username);
  };

  const availablePlayers = useMemo(
    () => data && data.players.filter((player) => !match.players.some((mp) => player.id === mp.id)),
    [data]
  );

  return (
    <ActionForm
      className="flex gap-4 mb-6"
      action={`/matches/${match.id}/players?index`}
      disabled={!selected}
      actionLabel="Add player"
    >
      <Combobox name="playerId" onChange={handleComboboxChange}>
        <div className="relative mt-1">
          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
            <Combobox.Input
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
              displayValue={() => selected || 'Select player'}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={handleComboFocus}
              placeholder="Select player"
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <HiChevronUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              <ComboboxOptionsContent players={availablePlayers} query={query} />
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </ActionForm>
  );
};

interface ComboboxOptionsContentProps {
  players: Array<PlayersRow> | undefined;
  query: string;
}

const ComboboxOptionsContent: FC<ComboboxOptionsContentProps> = ({ players, query }) => {
  const filteredPlayers = useMemo(() => {
    if (!players) {
      return [];
    }
    if (!query) {
      return players;
    }
    return players.filter((player) => player.username.toLowerCase().includes(query.toLowerCase()));
  }, [query, players]);

  if (!players) {
    return (
      <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
        <div role="status" className="max-w-sm animate-pulse">
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-500 w-48 mb-4"></div>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-500 max-w-[330px] mb-4"></div>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-500 max-w-[300px] mb-4"></div>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-500 max-w-[360px] mb-4"></div>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (filteredPlayers.length === 0 && query !== '') {
    return (
      <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
        Nothing found.
      </div>
    );
  }

  return (
    <>
      {filteredPlayers.map((player) => (
        <Combobox.Option
          key={player.id}
          className={({ active }) =>
            `relative cursor-default select-none py-2 pl-10 pr-4 ${
              active ? 'bg-teal-600 text-white' : 'text-gray-900'
            }`
          }
          value={player.id}
        >
          {({ selected, active }) => (
            <>
              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                {player.username}
              </span>
              {selected ? (
                <span
                  className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                    active ? 'text-white' : 'text-teal-600'
                  }`}
                >
                  <HiCheck className="h-5 w-5" aria-hidden="true" />
                </span>
              ) : null}
            </>
          )}
        </Combobox.Option>
      ))}
    </>
  );
};

export default AddPlayerForm;
