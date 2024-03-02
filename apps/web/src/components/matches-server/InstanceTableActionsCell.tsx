import { revalidatePath } from 'next/cache';
import { ArrowRightCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Instance } from '@bf2-matchmaking/types';
import IconBtn from '@/components/commons/IconBtn';
import { deleteServer } from '@/app/servers/[server]/actions';
import {
  addGeneratedServer,
  upsertMatchServer,
} from '@/app/matches/[match]/server/actions';
import { api } from '@bf2-matchmaking/utils';
import ActionWrapper from '@/components/commons/ActionWrapper';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {
  matchId: number;
  instance: Instance;
  isCurrentInstance: boolean;
}
export default async function InstanceTableActionsCell({
  matchId,
  instance,
  isCurrentInstance,
}: Props) {
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();
  const { data: dns } = await api.platform().getServerDns(instance.main_ip);

  async function deleteInstanceSA() {
    'use server';
    const result = await deleteServer(dns?.name || instance.main_ip);
    revalidatePath(`/matches/${matchId}/server`);
    return result;
  }
  async function setActiveServerSA() {
    'use server';
    return upsertMatchServer({
      id: matchId,
      server: dns?.name || instance.main_ip,
    });
  }

  return (
    <td className="flex gap-2">
      <ActionWrapper
        action={deleteInstanceSA}
        successMessage="Successfully deleted instance"
        errorMessage="Failed to delete instance"
        disabled={!adminRoles?.match_admin}
      >
        <IconBtn
          size="sm"
          variant="error"
          Icon={XCircleIcon}
          disabled={!adminRoles?.match_admin}
        />
      </ActionWrapper>
      {!isCurrentInstance && (
        <ActionWrapper
          action={setActiveServerSA}
          successMessage="Successfully set match server instance"
          errorMessage="Failed to set match server instance"
          disabled={!adminRoles?.match_admin}
        >
          <IconBtn
            size="sm"
            variant="info"
            Icon={ArrowRightCircleIcon}
            disabled={!adminRoles?.match_admin}
          />
        </ActionWrapper>
      )}
    </td>
  );
}
