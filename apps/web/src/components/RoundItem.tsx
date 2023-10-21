'use client';
import { useMemo, useState } from 'react';
import {
  LiveInfo,
  PlayerListItem,
  RoundsJoined,
  ServerInfo,
} from '@bf2-matchmaking/types';
import { UnmountClosed } from 'react-collapse';
import RoundTable from './RoundTable';
import { formatSecToMin } from '@bf2-matchmaking/utils';
import Image from 'next/image';
import { supabaseImageLoader } from '@/lib/supabase/supabase-client';
import Link from 'next/link';
import { parseJSON, parseNullableJSON } from '@bf2-matchmaking/utils/src/json-utils';

interface Props {
  round: RoundsJoined;
}

export default function RoundItem({ round }: Props) {
  const [isSummaryOpen, setSummaryOpen] = useState(false);

  const onRoundClick = () => {
    setSummaryOpen(!isSummaryOpen);
  };

  const info = parseNullableJSON<LiveInfo>(round.info);

  if (!info) {
    return null;
  }

  const roundTime =
    parseInt(info.roundTime) < parseInt(info.timeLimit)
      ? formatSecToMin(info.roundTime)
      : formatSecToMin(info.timeLimit);

  return (
    <li>
      <div className="card card-side w-full bg-base-100 shadow-xl">
        <figure className="relative w-1/4 overflow-hidden">
          <Image
            className="object-cover"
            loader={supabaseImageLoader}
            src={`map_images/${round.map.id}.webp`}
            fill={true}
            sizes="25%"
            alt={round.map.name}
          />
        </figure>
        <button className="card-body flex-row" onClick={onRoundClick}>
          <div className="mr-auto text-left">
            <p className="text-xl">{round.map.name}</p>
            <p className="text-sm">{`Round time: ${roundTime}`}</p>
          </div>
          <div>
            <p className="text-md font-bold">{info.team1_Name}</p>
            <p className="text-md">{info.team1_tickets}</p>
          </div>
          <div>
            <p className="text-md font-bold">{info.team2_Name}</p>
            <p className="text-md">{info.team2_tickets}</p>
          </div>
        </button>
      </div>
      <UnmountClosed isOpened={isSummaryOpen}>
        <RoundTable liveInfo={info} />
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
