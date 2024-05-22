'use client';
import { useMemo, useState } from 'react';
import {
  LiveState,
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
import Time from '@/components/commons/Time';

interface Props {
  round: RoundsJoined;
}

export default function RoundItem({ round }: Props) {
  const [isSummaryOpen, setSummaryOpen] = useState(false);

  const onRoundClick = () => {
    setSummaryOpen(!isSummaryOpen);
  };
  const info = parseNullableJSON<LiveState>(round.info);

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
        <button className="card-body flex-row gap-6" onClick={onRoundClick}>
          <div className="mr-auto text-left">
            <p className="text-xl">{round.map.name}</p>
            <p className="text-sm">{`Round time: ${roundTime}`}</p>
          </div>
          <div className="">
            <div className="text-md font-bold">{`Team ${round.team1.name}`}</div>
            <div className="text-lg">{info.team1_tickets}</div>
            <div className="text-xs">{info.team1_Name}</div>
          </div>
          <div className="">
            <div className="text-md font-bold">{`Team ${round.team2.name}`}</div>
            <div className="text-lg">{info.team2_tickets}</div>
            <div className="text-xs">{info.team2_Name}</div>
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
