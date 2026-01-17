'use client';
import { useMemo } from 'react';
import { DateTime } from 'luxon';
import classNames from 'classnames';

function toLocalISO(date: string | undefined | null, zone: string) {
  return date ? DateTime.fromISO(date).setZone(zone).toISO() || undefined : undefined;
}

const colors = {
  primary: 'input-primary',
  secondary: 'input-secondary',
  accent: 'input-accent',
  neutral: 'input-neutral',
  info: 'input-info',
  success: 'input-success',
  warning: 'input-warning',
  error: 'input-error',
  ghost: 'input-ghost',
} as const;
const sizes = {
  xs: 'input-xs',
  sm: 'input-sm',
  md: 'input-md',
  lg: 'input-lg',
  xl: 'input-xl',
} as const;

interface Props {
  defaultValue?: string | null;
  min?: string | null;
  max?: string | null;
  label: string;
  name: string;
  className?: string;
  size?: keyof typeof sizes;
  kind?: keyof typeof colors;
}

export default function DatetimeInput({
  label,
  name,
  defaultValue,
  min,
  max,
  className,
  size = 'md',
  kind = 'neutral',
}: Props) {
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

  const classes = classNames('select', sizes[size], colors[kind], className);

  return (
    <label className="floating-label">
      <span>{label}</span>
      <input
        className={classes}
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
