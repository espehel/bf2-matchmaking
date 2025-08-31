'use client';
import SelectField from '@/components/form/fields/SelectField';
import { PlayerListItem } from '@bf2-matchmaking/types';
import { ChangeEventHandler, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface Props {
  players: PlayerListItem[];
}

export default function ServerplayerSelect({ players }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = useCallback<ChangeEventHandler<HTMLSelectElement>>((event) => {
    const params = new URLSearchParams(searchParams);
    params.set('keyhash', event.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }, []);

  return (
    <SelectField
      name="playerKeyhash"
      placeholder="Select your BF2 account"
      options={players
        .map<[string, string]>((p) => [p.keyhash, p.getName])
        .concat([['dsad231fdsfda+=34', 'testy']])}
      onChange={handleChange}
    />
  );
}
