import React, { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
  title?: string;
}
export function Card({ children, title }: Props) {
  return (
    <div className="card bg-base-200 shadow-md border border-base-300 animate-slide-up">
      <div className="card-body">
        {title && (
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="card-title text-xl font-bold">{title}</h2>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
