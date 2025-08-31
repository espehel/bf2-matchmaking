'use client';
import React from 'react';
import { useActionForm } from '@/state/ActionFormContext';
import TransitionWrapper from '@/components/commons/TransitionWrapper';
import classNames from 'classnames';
import { Colors, Sizes } from '@/lib/types/daisyui';
interface Props {
  children: React.ReactNode;
  disabled?: boolean;
  size?: Sizes;
  kind?: Colors | 'ghost';
  className?: string;
}

export default function SubmitActionFormButton({
  children,
  disabled,
  size,
  kind = 'primary',
  className,
}: Props) {
  const { pending } = useActionForm();
  const classes = classNames(
    'btn w-fit',
    {
      [`btn-${kind}`]: kind,
      [`btn-${size}`]: size,
    },
    className
  );

  return (
    <button className={classes} type="submit" disabled={disabled || pending}>
      <TransitionWrapper keepSize={true}>{children}</TransitionWrapper>
    </button>
  );
}
