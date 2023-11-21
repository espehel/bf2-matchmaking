import React, { useMemo, useState } from 'react';
import PlayerSelect from '~/components/admin/PlayerSelect';
import { MatchesJoined, PlayersRow } from '@bf2-matchmaking/types';
import ActionForm from '~/components/form/ActionForm';
import ActionButton from '~/components/form/ActionButton';

interface Props {
  match: MatchesJoined;
}

const EditPlayerForm = ({ match }: Props) => {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayersRow>();

  const matchPlayer = useMemo(
    () => selectedPlayer && match.teams.find((mp) => mp.player_id === selectedPlayer.id),
    [selectedPlayer]
  );

  return (
    <>
      <ActionForm
        className={selectedPlayer ? 'flex flex-col gap-4' : 'flex gap-4'}
        action={selectedPlayer ? `/matches/${match.id}/players/${selectedPlayer.id}?index` : ''}
        disabled={!selectedPlayer}
        actionLabel={selectedPlayer ? `Edit ${selectedPlayer.username}` : 'Edit player'}
      >
        <PlayerSelect match={match} onPlayerSelected={setSelectedPlayer} />
        {matchPlayer && (
          <div className="flex gap-4">
            Team:
            <select className="dropdown" name="team" defaultValue={matchPlayer.team || 'null'}>
              <option value="null">No Team</option>
              <option value="a">Team A</option>
              <option value="b">Team B</option>
            </select>
            <label>
              Captain:
              <input
                className="text-field"
                name="captain"
                type="checkbox"
                defaultChecked={matchPlayer.captain}
                value="true"
              />
            </label>
            <label>
              Ready:
              <input
                className="text-field"
                name="ready"
                type="checkbox"
                defaultChecked={matchPlayer.ready}
                value="true"
              />
            </label>
          </div>
        )}
      </ActionForm>
      {selectedPlayer && (
        <ActionButton
          className="outline-button mt-2"
          action={`/matches/${match.id}/players/${selectedPlayer.id}/remove?index`}
        >
          {`Delete ${selectedPlayer.username}`}
        </ActionButton>
      )}
    </>
  );
};

export default EditPlayerForm;
