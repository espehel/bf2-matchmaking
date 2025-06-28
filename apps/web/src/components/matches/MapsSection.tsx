'use client';
import { MapsRow, MatchesJoined } from '@bf2-matchmaking/types';
import { useState } from 'react';
import Image from 'next/image';
import { supabaseImageLoader } from '@/lib/supabase/supabase-utils';

interface Props {
  match: MatchesJoined;
}

export default function MapsSection({ match }: Props) {
  const [currentMap, setCurrentMap] = useState<MapsRow | undefined>(match.maps.at(0));

  if (!currentMap) {
    return null;
  }

  return (
    <section className="section gap-0 w-full">
      <div className="tabs w-full">
        {match.maps.map((map) => (
          <button
            key={map.id}
            className={`tab tab-lg tab-lifted ${
              currentMap.id === map.id ? 'tab-active' : ''
            }`}
            onClick={() => setCurrentMap(map)}
          >
            {map.name}
          </button>
        ))}
      </div>
      <div className="card bg-base-100 shadow-xl image-full">
        <figure className="w-full h-full">
          <Image
            className="object-cover"
            loader={supabaseImageLoader}
            src={`map_images/${currentMap.id}.webp`}
            fill={true}
            sizes="100%"
            alt={currentMap.name}
          />
        </figure>
        <div className="card-body"></div>
      </div>
    </section>
  );
}
