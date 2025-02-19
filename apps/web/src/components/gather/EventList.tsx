'use client';
import { useEffect, useRef, useState } from 'react';
import { StreamEventReply } from '@bf2-matchmaking/types/redis';
import { api } from '@bf2-matchmaking/utils';
import Time from '@/components/commons/Time';
import { isStatusChange } from '@bf2-matchmaking/types';
import { useRouter } from 'next/navigation';

interface Props {
  defaultEvents: Array<StreamEventReply>;
  config: number;
}
let timeoutId: number | undefined;
export default function EventList({ defaultEvents, config }: Props) {
  const [events, setEvents] = useState(defaultEvents);
  const [isConnected, setConnected] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const router = useRouter();

  useEffect(() => {
    const source = api.v2.getGatherEventsStream(config, defaultEvents.at(0)?.id);

    source.addEventListener('data', (event) => {
      const newEvent = JSON.parse(event.data);
      setEvents((currentEvents) => [newEvent, ...currentEvents]);
      router.refresh();
    });

    source.addEventListener('heartbeat', (event) => {
      setConnected(true);
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setConnected(false);
      }, 15000);
    });

    return () => source.close();
  }, [defaultEvents, router]);

  useEffect(() => {
    listRef.current?.scrollTo(0, 0);
  }, [events]);

  return (
    <>
      <ul ref={listRef} className="overflow-auto max-h-60">
        {events.map((entry) => (
          <li key={entry.id}>
            <span className="mr-1">
              <Time date={Number(entry.message.timestamp)} format="LLL dd TT" />
            </span>
            <span className="inline-block mr-1 text-accent min-w-32">
              [{entry.message.event}]
            </span>
            <span className="text-info">{getText(entry)}</span>
          </li>
        ))}
      </ul>
      {isConnected ? (
        <p className="text-success text-xs text-right">Connected</p>
      ) : (
        <p className="text-warning text-xs text-right">Disconnected</p>
      )}
    </>
  );
}

function getText({ message }: StreamEventReply) {
  if (isStatusChange(message.payload)) {
    return `Status change: ${message.payload.prevStatus} -> ${message.payload.status}`;
  }
  if (message.event === 'playerJoin') {
    // @ts-ignore
    return `Player ${message.payload.nick} joined the queue`;
  }
  if (message.event === 'playerLeave') {
    // @ts-ignore
    return `Player ${message.payload.nick} left the queue`;
  }
  if (message.event === 'initiated') {
    // @ts-ignore
    return `Gather initiated at ${message.payload.address} with ${message.payload.playerCount} players`;
  }
  if (message.event === 'deleted') {
    // @ts-ignore
    return `Gather deleted state and player queue`;
  }
  return '';
}
