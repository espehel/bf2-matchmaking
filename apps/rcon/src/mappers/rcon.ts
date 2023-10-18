import { GameStatus, PlayerListItem, ServerInfo } from '@bf2-matchmaking/types';

export const mapServerInfo = (data?: string): ServerInfo | null => {
  if (!data) {
    return null;
  }
  const array = data.split('\t');
  return {
    reservedSlots: array[29],
    wallTime: array[28],
    team2: array[27],
    team1: array[26],
    ranked: array[25],
    autoBalanceTeam: array[24],
    timeLimit: array[23],
    worldSize: array[22],
    modDir: array[21],
    gameMode: array[20],
    timeLeft: array[19],
    roundTime: array[18],
    team2_null: array[17],
    team2_tickets: array[16],
    team2_startTickets: array[15],
    team2_TicketState: array[14],
    team2_Name: array[13],
    team1_null: array[12],
    team1_tickets: array[11],
    team1_startTickets: array[10],
    team1_TicketState: array[9],
    team1_Name: array[8],
    serverName: array[7],
    nextMapName: array[6],
    currentMapName: array[5],
    joiningPlayers: array[4],
    connectedPlayers: array[3],
    maxPlayers: array[2],
    currentGameStatus: array[1] as GameStatus,
    version: array[0],
  };
};

export const mapListPlayers = (data?: string): Array<PlayerListItem> | null =>
  data
    ? data
        .split(/(\r\n|\r|\n)/)
        .filter((text) => Boolean(text.trim()))
        .map((playerData) => {
          const array = playerData.split('\t');
          return {
            index: array[0],
            getName: array[1],
            getTeam: array[2],
            getPing: array[3],
            isConnected: array[4],
            isValid: array[5],
            isRemote: array[6],
            isAIPlayer: array[7],
            isAlive: array[8],
            isManDown: array[9],
            getProfileId: array[10],
            isFlagHolder: array[11],
            getSuicide: array[12],
            getTimeToSpawn: array[13],
            getSquadId: array[14],
            isSquadLeader: array[15],
            isCommander: array[16],
            getSpawnGroup: array[17],
            getAddress: array[18],
            scoreDamageAssists: array[19],
            scorePassengerAssists: array[20],
            scoreTargetAssists: array[21],
            scoreRevives: array[22],
            scoreTeamDamages: array[23],
            scoreTeamVehicleDamages: array[24],
            scoreCpCaptures: array[25],
            scoreCpDefends: array[26],
            scoreCpAssists: array[27],
            scoreCpNeutralizes: array[28],
            scoreCpNeutralizeAssists: array[29],
            scoreSuicides: array[30],
            scoreKills: array[31],
            scoreTKs: array[32],
            vehicleType: array[33],
            kitTemplateName: array[34],
            kiConnectedAt: array[35],
            deaths: array[36],
            score: array[37],
            vehicleName: array[38],
            rank: array[39],
            position: array[40],
            idleTime: array[41],
            keyhash: array[42],
            punished: array[43],
            timesPunished: array[44],
            timesForgiven: array[45],
          };
        })
    : null;

export function verifyData(si: ServerInfo, pl: Array<PlayerListItem>) {
  if (Number(si.connectedPlayers) !== pl.length) {
    throw new Error('Server info or player list have corrupt data.');
  }
}
