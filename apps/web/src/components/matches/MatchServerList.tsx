import { MatchesJoined } from '@bf2-matchmaking/types';
import { ServerStackIcon } from '@heroicons/react/24/solid';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/supabase-server';
import { api } from '@bf2-matchmaking/utils';
import IconBtn from '@/components/commons/IconBtn';
import { ArrowRightCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import ActionWrapper from '@/components/commons/ActionWrapper';
import { removeMatchServer } from '@/app/matches/[match]/actions';
import { revalidatePath } from 'next/cache';

interface Props {
  match: MatchesJoined;
}

export default async function MatchServerList({ match }: Props) {
  const cookieStore = await cookies();
  const { data: matchServers } = await supabase(cookieStore).getMatchServers(match.id);
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
      const res = await api.v2.postMatchServer(match.id, address, true);
      if (!res.error) {
        revalidatePath(`/matches/${match.id}`);
      }
      return res;
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
