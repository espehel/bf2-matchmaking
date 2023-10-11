import React, { FC } from 'react';
import { MatchStatus, ServersJoined } from '@bf2-matchmaking/types';
import { isActive } from '~/utils/servers-utils';
import { Link, useLoaderData, useSubmit } from '@remix-run/react';
import { loader } from '~/routes/matches/$matchId';
import { useUser } from '@supabase/auth-helpers-react';
import { isCaptain } from '@bf2-matchmaking/utils';

interface Props {
  server: ServersJoined;
}

const ServerSelectionItem: FC<Props> = ({ server }) => {
  const { match } = useLoaderData<typeof loader>();
  const user = useUser();
  const submit = useSubmit();

  const selectServer = (serverIp: string) => () =>
    submit({ serverIp }, { method: 'post', action: `/matches/${match.id}/server`, replace: true });

  if (match.server?.ip === server.ip) {
    return (
      <li>
        <div className="w-full p-1 border-4 border-sky-600 rounded text-center">
          <p className="truncate">{server.name}</p>
          <p className="text-blue-800">Selected</p>
        </div>
      </li>
    );
  }

  const activeMatch = server.matches.find(isActive);
  if (activeMatch?.status === MatchStatus.Ongoing) {
    return (
      <li>
        <div className="p-1 bg-gray-200 border-4 border-rose-200 rounded text-center">
          <p className="truncate">{server.name}</p>
          <Link
            to={`/matches/${activeMatch.id}`}
            className="text-red-600 hover:text-red-800 underline"
          >
            Ongoing
          </Link>
        </div>
      </li>
    );
  }
  if (activeMatch?.status === MatchStatus.Drafting) {
    return (
      <li>
        <div className="p-1 bg-gray-200 border-4 border-amber-200 rounded text-center">
          <p className="truncate">{server.name}</p>
          <Link
            to={`/matches/${activeMatch.id}`}
            className="text-yellow-600 hover:text-yellow-800 underline"
          >
            Drafting
          </Link>
        </div>
      </li>
    );
  }
  return (
    <li>
      <button
        className="w-full p-1 border-4 border-emerald-400 hover:border-emerald-600 rounded"
        onClick={selectServer(server.ip)}
        disabled={!isCaptain(match, user?.id)}
      >
        <p className="truncate">{server.name}</p>
        <p className="text-green-800">Available</p>
      </button>
    </li>
  );
};

export default ServerSelectionItem;
