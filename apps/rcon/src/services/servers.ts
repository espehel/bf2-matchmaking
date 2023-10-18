import { PlayerListItem, RconServer, ServerRconsRow } from '@bf2-matchmaking/types';
import { getPlayerList, getServerInfo, rcon } from '../net/RconManager';

export async function getRconServer({
  id: ip,
  rcon_port,
  rcon_pw,
}: ServerRconsRow): Promise<RconServer | null> {
  const info = await rcon(ip, rcon_port, rcon_pw)
    .then(getServerInfo)
    .catch(() => null);

  if (!info) {
    return null;
  }

  if (info.connectedPlayers === '0') {
    return { ...info, players: [], ip };
  }

  const players: Array<PlayerListItem> = await rcon(ip, rcon_port, rcon_pw)
    .then(getPlayerList)
    .catch(() => []);

  if (players.length !== Number(info.connectedPlayers)) {
    return null;
  }

  return { ...info, players, ip };
}
