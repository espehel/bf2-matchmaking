'use client';
import { useMemo } from 'react';
import { toLocalISO } from '@bf2-matchmaking/utils';

interface Props {
  defaultValue?: string | null;
  min?: string | null;
  max?: string | null;
  label: string;
  name: string;
}

export default function DatetimeInput({ label, name, defaultValue, min, max }: Props) {
  const localZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const localDefaultValue = useMemo(
    () => toLocalISO(defaultValue, localZone)?.substring(0, 16),
    [defaultValue, localZone]
  );
  const localMin = useMemo(
    () => toLocalISO(min, localZone)?.substring(0, 16),
    [localZone, min]
  );
  const localMax = useMemo(
    () => toLocalISO(max, localZone)?.substring(0, 16),
    [localZone, max]
  );
  return (
    <label className="floating-label">
      <span>{label}</span>
      <input
        className="input"
        type="datetime-local"
        name={name}
        defaultValue={localDefaultValue}
        min={localMin}
        max={localMax}
      />
      <input
        type="hidden"
        id="timezone"
        name="timezone"
        value={Intl.DateTimeFormat().resolvedOptions().timeZone}
      />
      <p className="label w-full">{`Timezone: ${localZone}`}</p>
    </label>
  );
}
