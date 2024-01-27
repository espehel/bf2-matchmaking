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
  const { data: liveMatch } = await api.rcon().getMatchLive(match.id);
  const { data: matchServer } = await supabase(cookies).getMatchServer(match.id);
  const isMatchOfficer = await supabase(cookies).isMatchOfficer(match);

  if (match.status !== MatchStatus.Ongoing) {
    return null;
  }

  async function startLiveMatch() {
    'use server';
    const result = await api.rcon().postMatchLive(match.id, false);
    if (result.data) {
      revalidatePath(`/matches/${match.id}`);
    }
    return result;
  }

  async function setLiveMatchServer() {
    'use server';
    assertObj(matchServer?.active);
    const result = await api
      .rcon()
      .postMatchLiveServer(match.id, matchServer.active?.ip, true);
    if (result.data) {
      revalidatePath(`/matches/${match.id}`);
    }
    return result;
  }

  return (
    <section className="section bg-accent text-accent-content w-full">
      <h2>Live</h2>
      <div className="text-left">
        <p>{`State: ${liveMatch?.liveState || 'offline'}`}</p>
        <p>{`Server: ${liveMatch?.liveInfo?.serverName || 'offline'}`}</p>
      </div>
      {liveMatch?.liveInfo ? (
        <RoundTable liveInfo={liveMatch.liveInfo} />
      ) : (
        <p className="text-xl font-bold">No match server found</p>
      )}
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
        {matchServer?.active &&
          matchServer.active.name != liveMatch?.liveInfo?.serverName &&
          isMatchOfficer && (
            <ActionButton
              action={setLiveMatchServer}
              successMessage={`Server ${matchServer.active.name} is now tracking live match`}
              errorMessage="Failed to set live match server"
              kind="btn-primary"
            >
              {`Track ${matchServer.active.name}`}
            </ActionButton>
          )}
      </div>
    </section>
  );
}
