'use client';
import { useEffect, useRef, useState } from 'react';
import { StreamEventReply } from '@bf2-matchmaking/types/redis';
import { api } from '@bf2-matchmaking/utils';
import Time from '@/components/commons/Time';
import { isStatusChange } from '@bf2-matchmaking/types';

interface Props {
  defaultEvents: Array<StreamEventReply>;
  config: number;
}

export default function EventList({ defaultEvents, config }: Props) {
  const [events, setEvents] = useState(defaultEvents);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const source = api.v2.getGatherEventsStream(config, events.at(-1)?.id);

    source.addEventListener('data', (event) => {
      const newEvent = JSON.parse(event.data);
      setEvents((currentEvents) => [...currentEvents, ...newEvent]);
    });

    return () => source.close();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [events]);

  return (
    <ul ref={listRef} className="overflow-auto">
      {events.map((entry) => (
        <li key={entry.id}>
          <span className="mr-1">
            <Time date={entry.message.timestamp} format="LLL dd TT" />
          </span>
          <span className="mr-1 text-accent">{entry.message.event}</span>
          <span className="text-info">{getText(entry)}</span>
        </li>
      ))}
    </ul>
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
  return '';
}
