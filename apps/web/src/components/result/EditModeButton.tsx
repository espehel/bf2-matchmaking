import IconBtn from '@/components/commons/IconBtn';
import { PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';

interface Props {
  edit: boolean;
  config: number | string;
}

export default async function EditModeButton({ edit, config }: Props) {
  const cookieStore = await cookies();
  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();
  if (!adminRoles?.match_admin) {
    return null;
  }
  return edit ? (
    <IconBtn
      Icon={XMarkIcon}
      size="sm"
      href={`/results/leagues/${config}/`}
      className="ml-auto text-error"
    />
  ) : (
    <IconBtn
      Icon={PencilSquareIcon}
      size="sm"
      href={`/results/leagues/${config}/?edit=true`}
      className="ml-auto text-secondary"
    />
  );
}
