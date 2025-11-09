'use client';
import React, { PropsWithChildren, useCallback } from 'react';
import { Colors, Sizes, Styles } from '@/lib/types/daisyui';
import { useAction } from '@/hooks/useAction';
import classNames from 'classnames';
import { ActionFunction, ActionInput } from '@/lib/types/form';

interface Props extends PropsWithChildren {
  action: ActionFunction;
  input: ActionInput;
  size?: Sizes;
  color?: Colors;
  style?: Styles;
  disabled?: boolean;
  className?: string;
}

export default function ActionButton({
  children,
  action,
  input,
  color,
  size,
  style,
  disabled,
  className,
}: Props) {
  const { isPending, trigger } = useAction(action, { disabled });

  const handleClick = useCallback(() => trigger(input), [trigger, input]);

  const classes = classNames(
    'btn',
    { [`btn-${color}`]: color, [`btn-${size}`]: size, [`btn-${style}`]: style },
    className
  );

  return (
    <button className={classes} onClick={handleClick} disabled={disabled || isPending}>
      {isPending && <span className="loading loading-spinner"></span>}
      {children}
    </button>
  );
}

/*
      <div className="relative">
        <div className="invisible">{children}</div>
        <div className="absolute left-0 top-0 w-full h-full -translate-y-2/4">
          <div className="loading loading-spinner" />
        </div>
      </div>
 */
