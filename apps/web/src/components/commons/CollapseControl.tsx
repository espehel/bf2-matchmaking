'use client';
import React, { PropsWithChildren, useState } from 'react';
import { Collapse } from 'react-collapse';
import IconBtn from '@/components/commons/IconBtn';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface Props extends PropsWithChildren {
  label: string;
  disabled?: boolean;
}

export default function CollapseControl({ children, label, disabled }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="text-right">
      {isOpen ? (
        <IconBtn Icon={XMarkIcon} onClick={() => setIsOpen(false)} />
      ) : (
        <button
          className="btn btn-primary ml-auto"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
        >
          {label}
        </button>
      )}
      <Collapse isOpened={isOpen}>{children}</Collapse>
    </div>
  );
}
