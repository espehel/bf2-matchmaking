import { revalidatePath } from 'next/cache';
import { ArrowRightCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Instance } from '@bf2-matchmaking/types';
import ActionForm from '@/components/commons/ActionForm';
import TransitionWrapper from '@/components/commons/TransitionWrapper';
import IconBtn from '@/components/commons/IconBtn';
import { deleteServer } from '@/app/servers/[server]/actions';
import { updateMatchServer } from '@/app/matches/[match]/server/actions';
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

  if (!adminRoles?.server_admin) {
    return null;
  }
  async function deleteInstanceSA() {
    'use server';
    const { data: dns } = await api.platform().getServerDns(instance.main_ip);
    const result = await deleteServer(dns?.name || instance.main_ip);
    revalidatePath(`/matches/${matchId}/server`);
    return result;
  }
  async function setMatchServerInstanceSA() {
    'use server';
    return updateMatchServer({ id: matchId, instance: instance.id });
  }

  return (
    <td className="flex gap-2">
      <ActionWrapper
        action={deleteInstanceSA}
        successMessage="Successfully deleted instance"
        errorMessage="Failed to delete instance"
      >
        <IconBtn size="sm" variant="error" Icon={XCircleIcon} />
      </ActionWrapper>
      {!isCurrentInstance && (
        <ActionWrapper
          action={setMatchServerInstanceSA}
          successMessage="Successfully set match server instance"
          errorMessage="Failed to set match server instance"
        >
          <IconBtn size="sm" variant="info" Icon={ArrowRightCircleIcon} />
        </ActionWrapper>
      )}
    </td>
  );
}
