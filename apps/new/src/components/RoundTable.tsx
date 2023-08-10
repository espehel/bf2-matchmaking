'use client';
import { PlayerListItem, ServerInfo } from '@bf2-matchmaking/types';

interface Props {
  serverInfo: ServerInfo;
  playerList: Array<PlayerListItem>;
}

const compareScore = (playerA: PlayerListItem, playerB: PlayerListItem) =>
  parseInt(playerB.score) - parseInt(playerA.score);

export default function RoundTable({ playerList, serverInfo }: Props) {
  const sortedPlayers = [...playerList].sort(compareScore);
  const getTeam = (teamNumber: string) =>
    teamNumber === '1' ? serverInfo.team1_Name : serverInfo.team2_Name;
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
          </tr>
        ))}
      </tbody>
    </table>
  );
}
