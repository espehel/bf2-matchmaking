import ServerCreateForm from '@/components/servers/ServerCreateForm';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {}

export default async function CreateServerSection({}: Props) {
  const { data: player } = await supabase(cookies).getSessionPlayer();

  if (!player) {
    return null;
  }

  return (
    <section className="bg-base-100 border-primary border-2 rounded p-4 mt-6">
      <h2 className="text-xl">Add server</h2>
      <ServerCreateForm />
    </section>
  );
}
