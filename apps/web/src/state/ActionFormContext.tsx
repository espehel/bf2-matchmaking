'use client';
import { createContext, useContext, useMemo, ReactNode } from 'react';
import { assertObj } from '@bf2-matchmaking/utils';

type ContextValue = {
  pending: boolean;
};

const ActionFormContext = createContext<ContextValue>({} as any);

interface Props {
  children: ReactNode;
  pending: boolean;
}
export function ActionFormProvider({ children, pending }: Props) {
  const context = useMemo<ContextValue>(
    () => ({
      pending,
    }),
    [pending]
  );
  return (
    <ActionFormContext.Provider value={context}>{children}</ActionFormContext.Provider>
  );
}

export function useActionForm() {
  const context = useContext(ActionFormContext);
  assertObj(context, 'useActionForm must be used inside a ActionFormProvider');
  return context;
}
