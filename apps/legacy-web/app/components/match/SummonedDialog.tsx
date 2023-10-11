import { FC, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Form, useLoaderData } from '@remix-run/react';
import { loader } from '~/routes/matches/$matchId';
import { usePlayer } from '~/state/PlayerContext';
import { MatchStatus } from '@bf2-matchmaking/types';
import Countdown from '~/components/Countdown';

export const SummonedDialog: FC = () => {
  const { match } = useLoaderData<typeof loader>();
  const { player, isMatchPlayer } = usePlayer();
  const [isTimedOut, setTimedOut] = useState(false);

  if (!player) {
    return null;
  }

  const isSummoned =
    match.status === MatchStatus.Summoning &&
    isMatchPlayer(match) &&
    match.teams.some((p) => p.player_id === player.id && !p.ready);

  return (
    <Dialog open={isSummoned} onClose={() => {}}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-8 text-center">
          <Dialog.Title className="text-4xl font-bold mb-4">Match starting</Dialog.Title>
          {match.ready_at && (
            <Countdown target={match.ready_at} onTimedOut={() => setTimedOut(true)} />
          )}
          <Form method="post" action={`./players/${player.id}/ready`}>
            <button type="submit" className="ready-button" disabled={isTimedOut}>
              Ready
            </button>
          </Form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
