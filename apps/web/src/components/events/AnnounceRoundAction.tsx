import { announceRound } from '@/app/events/[event]/actions';
import ActionButton from '../commons/action/ActionButton';
import { EventMatchesRow, EventRoundsRow } from '@bf2-matchmaking/types/supabase';

interface Props {
  round: EventRoundsRow & { matches: Array<EventMatchesRow> };
}

export async function AnnounceRoundAction({ round }: Props) {
  return (
    <ActionButton
      className="ml-4"
      action={announceRound}
      input={{ roundId: round.id }}
      size="xs"
      color="secondary"
    >
      Announce
    </ActionButton>
  );
}
