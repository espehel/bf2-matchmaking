'use client';
import { LiveState, PlayerListItem } from '@bf2-matchmaking/types';

interface Props {
  liveInfo: LiveState;
}

const compareScore = (playerA: PlayerListItem, playerB: PlayerListItem) =>
  parseInt(playerB.score) - parseInt(playerA.score);

export default function RoundTable({ liveInfo }: Props) {
  const sortedPlayers = [...liveInfo.players].sort(compareScore);
  const getTeam = (teamNumber: string) =>
    teamNumber === '1' ? liveInfo.team1_Name : liveInfo.team2_Name;
  return (
    <table className="table mt-2 bg-base-100 shadow-xl">
      <thead>
        <tr>
          <th />
          <th>Name</th>
          <th>Score</th>
          <th>Kills</th>
          <th>Deaths</th>
          <th>Team</th>
          <th>Id</th>
        </tr>
      </thead>
      <tbody>
        {sortedPlayers.map((player, i) => (
          <tr key={player.index} className="hover">
            <th>{i + 1}</th>
            <td className="truncate">{player.getName}</td>
            <td>{player.score}</td>
            <td>{player.scoreKills}</td>
            <td>{player.deaths}</td>
            <td>{getTeam(player.getTeam)}</td>
            <td>{player.index}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
