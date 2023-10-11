import React, { FC, useMemo } from 'react';
import { PlayerListItem, RoundsJoined, ServerInfo } from '@bf2-matchmaking/types';

interface Props {
  round: RoundsJoined;
}

const compareScore = (playerA: PlayerListItem, playerB: PlayerListItem) =>
  parseInt(playerB.score) - parseInt(playerA.score);

const toTimeString = (seconds: number) =>
  (seconds - (seconds %= 60)) / 60 + (9 < seconds ? ':' : ':0') + seconds;

const RoundSummary: FC<Props> = ({ round }: Props) => {
  const serverInfo: ServerInfo = useMemo(
    () => (typeof round.si === 'string' ? JSON.parse(round.si) : null),
    [round]
  );
  const playerList: Array<PlayerListItem> = useMemo(
    () => (typeof round.pl === 'string' ? JSON.parse(round.pl) : null), //(mock as any) : null),
    [round]
  );
  if (!serverInfo || !playerList) {
    return <p>Round summary not available.</p>;
  }

  const team1 = playerList.filter((player) => player.getTeam === '1').sort(compareScore);
  const team2 = playerList.filter((player) => player.getTeam === '2').sort(compareScore);
  return (
    <div className="ml-4">
      <div className="flex gap-4 mb-4">
        <p>{`Round time: ${toTimeString(parseInt(serverInfo.roundTime))}`}</p>
      </div>
      <div className="flex">
        <div className="w-1/2">
          <p className="font-bold text-lg mb-2">Team 1</p>
          <ul className="grid grid-cols-fr_50_50 gap-x-2">
            <li className="contents font-bold">
              <span className="">Name</span>
              <span>Score</span>
              <span>K/D</span>
            </li>
            {team1.map((player) => (
              <li className="contents" key={player.index}>
                <span className="truncate">{player.getName}</span>
                <span>{player.score}</span>
                <span>{`${player.scoreKills}/${player.deaths}`}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-1/2">
          <p className="font-bold text-lg mb-2">Team 2</p>
          <ul className="grid grid-cols-fr_50_50 gap-x-2">
            <li className="contents font-bold">
              <span className="">Name</span>
              <span>Score</span>
              <span>K/D</span>
            </li>
            {team2.map((player) => (
              <li className="contents" key={player.index}>
                <span className="truncate">{player.getName}</span>
                <span>{player.score}</span>
                <span>{`${player.scoreKills}/${player.deaths}`}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RoundSummary;
