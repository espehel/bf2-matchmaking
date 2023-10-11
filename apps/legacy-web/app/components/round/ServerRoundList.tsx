import React, { FC } from 'react';
import { groupRoundsByServer } from '~/utils/round-utils';
import RoundItem from '../../components/round/RoundItem';
import { RoundsJoined } from '@bf2-matchmaking/types';

interface Props {
  rounds: Array<RoundsJoined>;
}
const ServerRoundList: FC<Props> = ({ rounds }) => {
  const groupedByServer = groupRoundsByServer(rounds);
  return (
    <div className={'ml-2'}>
      {groupedByServer.map(([serverName, serverRounds]) => (
        <section className="mb-2" key={serverName}>
          <h3 className="font-bold">Server: {serverName}</h3>
          <ul className="ml-2 space-y-2">
            {serverRounds
              .filter((round) => round.pl !== 'null' && Boolean(round.pl && round.si))
              .map((round) => (
                <RoundItem round={round} key={round.id} />
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default ServerRoundList;
