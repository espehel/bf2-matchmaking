import { supabase } from '@/lib/supabase/supabase';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { cookies } from 'next/headers';
import ConfigCard from '@/components/admin/ConfigCard';

export default async function Page() {
  const cookieStore = await cookies();
  const configs = await supabase(cookieStore).getMatchConfigs().then(verifyResult);
  return (
    <main className="main">
      <h1 className="text-3xl">Configs</h1>
      <ul className="grid grid-cols-3 gap-3 justify-center items-center w-fit m-auto">
        {configs.map((config) => (
          <li key={config.id}>
            <ConfigCard config={config} />
          </li>
        ))}
      </ul>
    </main>
  );
}
