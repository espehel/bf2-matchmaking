import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import RoundTable from '@/components/RoundTable';
import { api, assertObj } from '@bf2-matchmaking/utils';
import ActionButton from '@/components/ActionButton';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {
  match: MatchesJoined;
}
export default async function LiveSection({ match }: Props) {
  const { data: liveMatch } = await api.v2.getMatch(match.id);
  const cookieStore = await cookies();
  const { data: matchServer } = await supabase(cookieStore).getMatchServers(match.id);
  const isMatchOfficer = await supabase(cookieStore).isMatchOfficer(match);

  //TODO: handle multiple match servers
  const server = matchServer?.servers?.at(0);

  if (match.status !== MatchStatus.Ongoing) {
    return null;
  }

  async function startLiveMatch() {
    'use server';
    const result = await api.v2.postMatchStart(match.id);
    if (result.data) {
      revalidatePath(`/matches/${match.id}`);
    }
    return result;
  }

  async function setLiveMatchServer() {
    'use server';
    assertObj(server);
    const result = await api.v2.postMatchServer(match.id, server?.ip, true);
    if (result.data) {
      revalidatePath(`/matches/${match.id}`);
    }
    return result;
  }

  return (
    <section className="section w-full">
      <h2>Live</h2>
      <div className="text-left">
        <p>{`State: ${liveMatch?.state || 'offline'}`}</p>
        <p>{`Server: ${liveMatch?.server?.data?.name || 'offline'}`}</p>
      </div>
      {liveMatch?.server?.live ? (
        <RoundTable liveInfo={liveMatch.server.live} />
      ) : (
        <p className="text-xl font-bold">No match server found</p>
      )}
      {
        <div className="flex gap-2">
          {!liveMatch && isMatchOfficer && (
            <ActionButton
              action={startLiveMatch}
              successMessage="Live match started"
              errorMessage="Failed to start live match"
              kind="btn-primary"
            >
              Start live match
            </ActionButton>
          )}
          {server && server.name != liveMatch?.server?.data?.name && isMatchOfficer && (
            <ActionButton
              action={setLiveMatchServer}
              successMessage={`Server ${server.name} is now tracking live match`}
              errorMessage="Failed to set live match server"
              kind="btn-primary"
            >
              {`Track ${server.name}`}
            </ActionButton>
          )}
        </div>
      }
    </section>
  );
}
