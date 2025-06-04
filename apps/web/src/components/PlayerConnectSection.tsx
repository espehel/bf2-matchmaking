'use client';
import { PlayerListItem } from '@bf2-matchmaking/types';
import { publicIpv4 } from 'public-ip';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AuthButton from '@/components/AuthButton';
import { ClipboardIcon } from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import copy from 'copy-text-to-clipboard';
import { updatePlayerByUserId } from '@/app/rounds/[round]/connect/actions';
import { toast } from 'react-toastify';
import { User } from '@supabase/supabase-js';

interface Props {
  playerList: Array<PlayerListItem>;
  user: User | null;
}

export default function PlayerConnectSection({ playerList, user }: Props) {
  const [player, setPlayer] = useState<PlayerListItem | null | undefined>();

  const findAndSetPlayer = useCallback(
    (ip: string) => {
      const player = playerList.find((p) => p.getAddress === ip);
      if (player) {
        setPlayer(player);
      } else {
        setPlayer(null);
      }
    },
    [playerList]
  );

  useEffect(() => {
    publicIpv4().then(findAndSetPlayer);
  }, [findAndSetPlayer]);

  const updatePlayerKeyHash = useCallback(
    async (user: User, rconPlayer: PlayerListItem) => {
      const { error } = await updatePlayerByUserId(user.id, {
        keyhash: rconPlayer.keyhash,
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success('Player hash updated');
      }
    },
    []
  );

  if (player === null) {
    return (
      <section className="mt-4">
        <div>Can&apos;t find player with your current public ip address</div>
      </section>
    );
  }

  if (!player) {
    return (
      <section className="mt-4">
        <span className="loading loading-spinner loading-lg" />
      </section>
    );
  }

  if (user) {
    return (
      <section className="mt-4">
        <h2 className="text-2xl bold mb-4">{player.getName}</h2>
        <p>We found a player matching with your public ip!</p>
        <button
          onClick={() => updatePlayerKeyHash(user, player)}
          className="btn btn-primary mt-4"
        >
          Claim
        </button>
      </section>
    );
  }

  return (
    <section className="mt-4">
      <h2 className="text-2xl bold mb-4">Matched {player.getName} with your ip</h2>
      <div className="flex w-full justify-around gap-4">
        <div className="shrink flex flex-col gap-2">
          <p>Log in and claim player</p>
          <AuthButton className="btn btn-primary" user={user} />
        </div>
        <div className="divider divider-horizontal">OR</div>
        <div className="shrink flex flex-col gap-2">
          <p>Send Message to BF2 Matchmaking Discord Bot</p>
          <div className="flex bg-neutral text-neutral-content p-2 rounded items-center gap-2">
            <code>/register {player.keyhash}</code>
            <button
              className="tooltip tooltip-info"
              onClick={() => copy(`/register ${player.keyhash}`)}
              data-tip="Copy to clipboard"
            >
              <ClipboardIcon className="h-5 hover:text-primary active:text-secondary" />
            </button>
          </div>
          <Link
            className="btn btn-secondary"
            target="_blank"
            href="https://discord.com/users/1036670840667914251"
          >
            Go to Bot
            <ArrowTopRightOnSquareIcon className="h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
