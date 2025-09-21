'use client';
import { useEffect, useRef, useState } from 'react';
import { StreamEventReply } from '@bf2-matchmaking/types/redis';
import { api } from '@bf2-matchmaking/utils';
import Time from '@/components/commons/Time';
import { useRouter } from 'next/navigation';
import { GatherEvent } from '@bf2-matchmaking/types/gather';

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
            <span className="text-info">{getText(entry as GatherEvent)}</span>
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

function getText({ message }: GatherEvent): string {
  switch (message.event) {
    case 'initiated':
      return `Gather initiated at ${message.payload.address} with ${message.payload.clientUIds.length} players`;
    case 'playerJoining':
      return `${message.payload.nick} is joining...`;
    case 'playerJoined':
      return `${message.payload.nick} joined.`;
    case 'playerRejected':
      return `${message.payload.nick} was rejected: Missing ${message.payload.reason}`;
    case 'playerLeft':
      return `${message.payload.nick} left.`;
    case 'playersSummoned':
      return `Summoning ${message.payload.clientUIds.length} players to ${message.payload.address}`;
    case 'playerKicked':
      return `${message.payload.nick} was kicked: ${message.payload.reason}`;
    case 'summonComplete':
      return `Summon complete for ${message.payload.clientUIds.length} players.`;
    case 'playerMoved':
      return `${message.payload.nick} moved to ${message.payload.toChannel}.`;
    case 'gatherStarted':
      return `Gather started with match ${message.payload.matchId}.`;
    case 'nextQueue':
      return `Starting next queue at ${message.payload.address} with ${message.payload.clientUIds.length} players.`;
    case 'summonFail':
      return `Summon failed with ${message.payload.missingClientUIds.length} players not joining server.`;
  }
}
