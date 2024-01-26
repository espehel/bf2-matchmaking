'use client';
import { Listbox } from '@headlessui/react';
import { useCallback } from 'react';
import { isNotNull } from '@bf2-matchmaking/types';

interface Props {
  options: Array<[string, string]>;
  defaultValues?: Array<string>;
  label: string;
  name: string;
  placeholder: string;
}

export default function MultiSelect({
  options,
  label,
  name,
  placeholder,
  defaultValues,
}: Props) {
  const sortedOptions = [...options].sort((optionA, optionB) =>
    optionA[1].localeCompare(optionB[1])
  );

  const toOptionsName = useCallback(
    (regionKey: string) => options.find(([key]) => regionKey === key)?.at(1) || null,
    [options]
  );
  return (
    <div className="dropdown dropdown-end dropdown-bottom min-w-[360px]">
      <label className="label" htmlFor={name}>
        <span className="label-text">{label}</span>
      </label>
      <Listbox name={name} multiple defaultValue={defaultValues}>
        <Listbox.Button className="input input-bordered input-md w-full text-left font-bold">
          {({ value }) =>
            value.length
              ? value.map(toOptionsName).filter(isNotNull).join(', ')
              : placeholder
          }
        </Listbox.Button>
        <Listbox.Options className="dropdown-content grid grid-cols-3 shadow bg-base-100 border border-1 rounded-box p-0 z-[1]">
          {sortedOptions.map(([key, optionName]) => (
            <Listbox.Option
              className="m-1 p-1.5 text-md text-left rounded cursor-pointer ui-active:bg-accent ui-active:text-accent-content ui-selected:bg-primary ui-selected:text-primary-content"
              key={key}
              value={key}
            >
              {optionName}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </Listbox>
    </div>
  );
}
