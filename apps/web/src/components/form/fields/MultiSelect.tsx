'use client';
import { SyntheticEvent, useCallback, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { sortOptions } from '@bf2-matchmaking/utils';
import { Option } from '@/lib/types/form';

interface Props {
  options: Array<Option>;
  defaultOptions?: Array<Option>;
  name: string;
  placeholder: string;
  onOptionSelected?: (option: Option) => void;
  onOptionRemoved?: (option: Option) => void;
}

export default function MultiSelect({
  options,
  defaultOptions = [],
  name,
  placeholder,
  onOptionSelected,
  onOptionRemoved,
}: Props) {
  const [selectedOptions, setSelectedOptions] = useState<Array<Option>>(
    () => defaultOptions
  );

  const sortedOptions = useMemo(() => sortOptions(options), [options]);
  const visibleOptions = useMemo(
    () =>
      sortedOptions.filter(
        (option) => !selectedOptions.some((selected) => option[0] === selected[0])
      ),
    [sortedOptions, selectedOptions]
  );

  const handleOptionSelected = useCallback(
    (e: SyntheticEvent<HTMLSelectElement, Event>) => {
      const option = options.find(
        ([value]) => value.toString() === e.currentTarget.value.toString()
      );
      if (!option) {
        return;
      }
      setSelectedOptions((prevState) => [...prevState, option]);
      onOptionSelected?.(option);
    },
    [options, onOptionSelected]
  );

  return (
    <>
      <div>
        {selectedOptions.map(([value], i) => (
          <input
            key={value}
            className="hidden"
            name={`${name}[${i}]`}
            value={value}
            readOnly
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                const removed = selectedOptions.find((s) => s[0] === value);
                setSelectedOptions(selectedOptions.filter((s) => s[0] !== value));
                if (removed) onOptionRemoved?.(removed);
              }}
              className="badge badge-info min-w-0 cursor-pointer"
            >
              <XMarkIcon className="size-4 shrink-0" />
              <p className="truncate">{label}</p>
            </button>
          ))}
        </div>
        <select
          className="select"
          onChange={handleOptionSelected}
          onSelect={handleOptionSelected}
          defaultValue=""
        >
          {
            <option value="" disabled>
              {placeholder}
            </option>
          }
          {visibleOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
