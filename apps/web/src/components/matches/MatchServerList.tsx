import { MatchesJoined } from '@bf2-matchmaking/types';
import { ServerStackIcon } from '@heroicons/react/24/solid';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/supabase';
import { api } from '@bf2-matchmaking/utils';
import IconBtn from '@/components/commons/IconBtn';
import { ArrowRightCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import ActionWrapper from '@/components/commons/ActionWrapper';
import { removeMatchServer } from '@/app/matches/[match]/actions';

interface Props {
  match: MatchesJoined;
}

export default async function MatchServerList({ match }: Props) {
  const { data: matchServers } = await supabase(cookies).getMatchServers(match.id);
  if (!matchServers) {
    return null;
  }

  function removeMatchServerSA(address: string) {
    return async () => {
      'use server';
      return removeMatchServer(match.id, address);
    };
  }
  function setActiveServer(address: string) {
    return async () => {
      'use server';
      return api.live().postMatchServer(match.id, address, true);
    };
  }
  return (
    <ul>
      {matchServers.servers.map((s) => (
        <li key={s.ip} className="flex gap-1 items-center">
          <ServerStackIcon className="size-4" />
          {s.ip}
          <ActionWrapper
            action={removeMatchServerSA(s.ip)}
            successMessage="Match server removed"
            errorMessage="Failed to remove match server"
          >
            <IconBtn Icon={XCircleIcon} size="xs" className="text-error" />
          </ActionWrapper>
          <ActionWrapper
            action={setActiveServer(s.ip)}
            successMessage="Active server set"
            errorMessage="Failed to set active server"
          >
            <IconBtn Icon={ArrowRightCircleIcon} size="xs" className="text-info" />
          </ActionWrapper>
        </li>
      ))}
    </ul>
  );
}
