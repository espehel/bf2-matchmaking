'use client';
import { PlayerListItem, PlayersRow } from '@bf2-matchmaking/types';
import PlayerCombobox from '@/components/PlayerCombobox';
import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

interface Props {
  playerList: Array<PlayerListItem>;
  registeredPlayers: Array<PlayersRow>;
  matchPlayers: Array<PlayersRow>;
  registerPlayerAction: (
    playerId: string,
    keyhash: string
  ) => PromiseLike<PostgrestSingleResponse<PlayersRow>>;
}

const compareScore = (playerA: PlayerListItem, playerB: PlayerListItem) =>
  parseInt(playerB.score) - parseInt(playerA.score);

export default function PlayersRegisterSection({
  playerList,
  registeredPlayers,
  registerPlayerAction,
  matchPlayers,
}: Props) {
  const sortedPlayers = [...playerList].sort(compareScore);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayersRow | null>(null);

  const nonAttendingPlayers = matchPlayers.filter(
    (p) => !playerList.some(({ keyhash }) => p.keyhash === keyhash)
  );
  const getRegisteredBadge = useCallback(
    (keyhash: string) => {
      const player = registeredPlayers.find((p) => p.keyhash === keyhash);
      if (player) {
        return (
          <div className="tooltip" data-tip={player.nick}>
            <div className="badge badge-success badge-sm"></div>
          </div>
        );
      }
      return <div className="badge badge-error badge-sm" />;
    },
    [registeredPlayers]
  );

  const handleRegisterClick = useCallback(
    async (keyhash: string) => {
      if (!selectedPlayer) {
        return toast.error('Select a player to register');
      }
      const { error } = await registerPlayerAction(selectedPlayer.id, keyhash);
      if (error) {
        toast.error(`Failed to register keyhash of ${selectedPlayer.nick}`);
      } else {
        toast.success(`Updated keyhash of ${selectedPlayer.nick}`);
      }
    },
    [registerPlayerAction, selectedPlayer]
  );

  return (
    <section className="mt-2">
      <div className="flex items-center gap-6">
        <PlayerCombobox onPlayerSelected={setSelectedPlayer} />
        <div className="grow bg-base-100 rounded shadow p-2">
          <p>{`Selected: ${selectedPlayer?.nick || 'None'}`}</p>
          <p>{`Keyhash: ${selectedPlayer?.keyhash || 'None'}`}</p>
        </div>
      </div>
      <table className="table mt-2 bg-base-100 shadow-xl">
        <thead>
          <tr>
            <th />
            <th>Name</th>
            <th>Keyhash</th>
            <th>Exists</th>
            <th>Register</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player, i) => (
            <tr key={player.index} className="hover">
              <th>{i + 1}</th>
              <td className="truncate">{player.getName}</td>
              <td>{player.keyhash}</td>
              <td>{getRegisteredBadge(player.keyhash)}</td>
              <td>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleRegisterClick(player.keyhash)}
                >
                  Register
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {nonAttendingPlayers.length > 0 && (
        <div className="mt-4 bg-base-100 rounded shadow p-2">
          <p className="font-bold">Players not attending</p>
          <ul>
            {nonAttendingPlayers.map((player) => (
              <li key={player.id}>{player.nick}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
