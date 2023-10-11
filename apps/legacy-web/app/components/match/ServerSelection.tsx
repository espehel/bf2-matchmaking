import React, { FC } from 'react';
import { loader } from '~/routes/matches/$matchId';
import { useLoaderData } from '@remix-run/react';
import ServerSelectionItem from '~/components/match/ServerSelectionItem';
import { compareServer } from '~/utils/servers-utils';

const ServerSelection: FC = () => {
  const { servers, match } = useLoaderData<typeof loader>();

  if (!servers) {
    return null;
  }

  return (
    <section className="section w-full">
      <h2 className="text-xl">Servers</h2>
      <ul className="grid grid-cols-3 auto-cols-max gap-4">
        {servers.sort(compareServer(match)).map((server) => (
          <ServerSelectionItem key={server.ip} server={server} />
        ))}
      </ul>
    </section>
  );
};

export default ServerSelection;
