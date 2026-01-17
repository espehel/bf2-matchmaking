import { LiveServer } from '@bf2-matchmaking/types/server';
import GuardedActionButton from '@/components/commons/GuardedActionButton';
import {
  restartServerInfantry,
  restartServerVehicles,
} from '@/app/servers/[server]/actions';
import { restartServer } from '@/app/matches/[match]/actions';
import { revalidatePath } from 'next/cache';
import { toFetchError } from '@bf2-matchmaking/utils';

interface Props {
  matchId: number;
  server: LiveServer;
  isMatchPlayer: boolean;
}
export async function RestartServerAction({ server, matchId, isMatchPlayer }: Props) {
  async function restartAction() {
    'use server';
    try {
      if (!server.data) {
        await restartServer(server.address);
      } else if (server.data.noVehicles) {
        await restartServerInfantry(server.address);
      } else {
        await restartServerVehicles(server.address);
      }
      revalidatePath(`/matches/${matchId}`);
      return { data: 'ok', error: null };
    } catch (error) {
      return { data: null, error: toFetchError(error) };
    }
  }
  return (
    <GuardedActionButton
      label="Restart server"
      guard={server.live ? server.live.players.length > 0 : false}
      guardLabel="Server is populated, are you sure you want to restart?"
      formAction={restartAction}
      successMessage="Server restarting"
      errorMessage="Failed to restart server"
      disabled={!isMatchPlayer}
    />
  );
}
