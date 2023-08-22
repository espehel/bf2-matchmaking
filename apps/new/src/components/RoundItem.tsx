'use client';
import { useMemo, useState } from 'react';
import { PlayerListItem, RoundsJoined, ServerInfo } from '@bf2-matchmaking/types';
import { UnmountClosed } from 'react-collapse';
import RoundTable from './RoundTable';
import { formatSecToMin } from '@bf2-matchmaking/utils';
import Image from 'next/image';
import { supabaseImageLoader } from '@/lib/supabase-client';
import Link from 'next/link';

interface Props {
  round: RoundsJoined;
}

export default function RoundItem({ round }: Props) {
  const [isSummaryOpen, setSummaryOpen] = useState(false);

  const onRoundClick = () => {
    setSummaryOpen(!isSummaryOpen);
  };

  const serverInfo: ServerInfo = useMemo(
    () => (typeof round.si === 'string' ? JSON.parse(round.si) : null),
    [round]
  );
  const playerList: Array<PlayerListItem> = useMemo(
    () => (typeof round.pl === 'string' ? JSON.parse(round.pl) : null),
    [round]
  );

  if (!serverInfo || !playerList) {
    return null;
  }

  const roundTime =
    parseInt(serverInfo.roundTime) < parseInt(serverInfo.timeLimit)
      ? formatSecToMin(serverInfo.roundTime)
      : formatSecToMin(serverInfo.timeLimit);

  return (
    <li>
      <div className="card card-side w-full bg-base-100 shadow-xl">
        <figure className="relative w-1/4 overflow-hidden">
          <Image
            className="object-cover"
            loader={supabaseImageLoader}
            src={`map_images/${round.map.id}.webp`}
            fill={true}
            alt={round.map.name}
          />
        </figure>
        <button className="card-body flex-row" onClick={onRoundClick}>
          <div className="mr-auto text-left">
            <p className="text-xl">{round.map.name}</p>
            <p className="text-sm">{`Round time: ${roundTime}`}</p>
          </div>
          <div>
            <p className="text-md font-bold">{round.team1_name}</p>
            <p className="text-md">{round.team1_tickets}</p>
          </div>
          <div>
            <p className="text-md font-bold">{round.team2_name}</p>
            <p className="text-md">{round.team2_tickets}</p>
          </div>
        </button>
      </div>
      <UnmountClosed isOpened={isSummaryOpen}>
        <RoundTable serverInfo={serverInfo} playerList={playerList} />
        <div className="flex justify-end">
          <Link
            className="btn btn-secondary btn-sm mt-2 mr-2"
            href={`/rounds/${round.id}`}
          >
            Round details
          </Link>
        </div>
      </UnmountClosed>
    </li>
  );
}
