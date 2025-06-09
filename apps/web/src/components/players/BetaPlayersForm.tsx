'use client';
import { MouseEventHandler, useCallback, useRef, useState } from 'react';
import { addBetaPlayers, getBetaPlayers } from '@/app/admin/players/actions';

interface Props {
  betaPlayerIds: string[];
}

export default function BetaPlayersForm({ betaPlayerIds }: Props) {
  const [guildId, setGuildId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [members, setMembers] = useState<Array<[string, string]>>([]);
  const ref = useRef<HTMLDialogElement>(null);
  const handleCloseForm: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      event.preventDefault();
      ref?.current?.close();
    },
    [ref]
  );
  const getMembers = useCallback(async () => {
    if (guildId && roleId) {
      setMembers(await getBetaPlayers(guildId, roleId));
    }
  }, [guildId, roleId]);

  return (
    <div>
      <div>
        <label className="label" htmlFor="guildInput">
          <span className="label-text">Guild id</span>
        </label>
        <input
          type="text"
          className="input"
          onChange={(e) => setGuildId(e.target.value)}
          value={guildId}
        />
      </div>
      <div>
        <label className="label" htmlFor="roleInput">
          <span className="label-text">Role id</span>
        </label>
        <input
          type="text"
          className="input"
          onChange={(e) => setRoleId(e.target.value)}
          value={roleId}
        />
      </div>
      <button
        className="btn btn-sm btn-secondary"
        onClick={() => ref.current?.showModal()}
      >
        Add beta players
      </button>
      <dialog ref={ref} className="modal">
        <div className="modal-box">
          <ul>
            {members.map(([id, nick]) => (
              <li key={id}>{nick}</li>
            ))}
          </ul>
          <div className="modal-action">
            <button
              className="btn btn-primary"
              onClick={() => addBetaPlayers(members.map(([id]) => id))}
            >
              Add players
            </button>
            <button className="btn btn-primary" onClick={getMembers}>
              Fetch players
            </button>
            <button onClick={handleCloseForm} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
