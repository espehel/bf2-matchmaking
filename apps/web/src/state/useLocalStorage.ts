'use client';
import { useCallback, useSyncExternalStore } from 'react';

let listenersKeyMap: Map<string, Array<VoidFunction>> = new Map();

export function useLocalStorage(key: string) {
  const subscribe = useCallback(
    (listener: VoidFunction) => {
      const listeners = listenersKeyMap.get(key) || [];
      listenersKeyMap.set(key, [...listeners, listener]);
      return () => {
        listenersKeyMap.set(
          key,
          listeners.filter((l) => l !== listener)
        );
      };
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    return localStorage.getItem(key);
  }, [key]);

  const syncedValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const set = useCallback((nextValue: string) => {
    localStorage.setItem(key, nextValue);
    emitChange(key);
  }, []);
  return [syncedValue, set] as const;
}

function getServerSnapshot() {
  return null;
}

function emitChange(key: string) {
  const listeners = listenersKeyMap.get(key) || [];
  for (let listener of listeners) {
    listener();
  }
}
