import { PlayersRow } from './database-types';

export * from './database-types.generated';
export * from './api-types';
export * from './database-types';
export * from './type-guards';

type WebhookPostgresChangesPayloadBase = {
  schema: string;
  table: string;
};

export type WebhookPostgresInsertPayload<T extends Record<string, any>> =
  WebhookPostgresChangesPayloadBase & {
    type: `${WEBHOOK_POSTGRES_CHANGES_TYPE.INSERT}`;
    record: T;
    old_record: null;
  };

export type WebhookPostgresUpdatePayload<T extends Record<string, any>> =
  WebhookPostgresChangesPayloadBase & {
    type: `${WEBHOOK_POSTGRES_CHANGES_TYPE.UPDATE}`;
    record: T;
    old_record: Partial<T>;
  };

export type WebhookPostgresDeletePayload<T extends Record<string, any>> =
  WebhookPostgresChangesPayloadBase & {
    type: `${WEBHOOK_POSTGRES_CHANGES_TYPE.DELETE}`;
    record: null;
    old_record: Partial<T>;
  };

export type WebhookPostgresChangesPayload<T extends Record<string, any>> =
  | WebhookPostgresInsertPayload<T>
  | WebhookPostgresUpdatePayload<T>
  | WebhookPostgresDeletePayload<T>;

export enum WEBHOOK_POSTGRES_CHANGES_TYPE {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export interface PostgrestError {
  message: string;
  details: string | null;
  hint: string;
  code: string;
}

export interface ServerInfo {
  version: string;
  currentGameStatus: string;
  maxPlayers: string;
  connectedPlayers: string;
  joiningPlayers: string;
  currentMapName: string;
  nextMapName: string;
  serverName: string;

  team1_Name: string;
  team1_TicketState: string;
  team1_startTickets: string;
  team1_tickets: string;
  team1_null: string;

  team2_Name: string;
  team2_TicketState: string;
  team2_startTickets: string;
  team2_tickets: string;
  team2_null: string;

  roundTime: string;
  timeLeft: string;
  gameMode: string;
  modDir: string;
  worldSize: string;
  timeLimit: string;
  autoBalanceTeam: string;
  ranked: string;
  team1: string;
  team2: string;
  wallTime: string;
  reservedSlots: string;
}

export interface PlayerListItem {
  index: string;
  getName: string;
  getTeam: string;
  getPing: string;
  isConnected: string;
  isValid: string;
  isRemote: string;
  isAIPlayer: string;
  isAlive: string;
  isManDown: string;
  getProfileId: string;
  isFlagHolder: string;
  getSuicide: string;
  getTimeToSpawn: string;
  getSquadId: string;
  isSquadLeader: string;
  isCommander: string;
  getSpawnGroup: string;
  getAddress: string;
  scoreDamageAssists: string;
  scorePassengerAssists: string;
  scoreTargetAssists: string;
  scoreRevives: string;
  scoreTeamDamages: string;
  scoreTeamVehicleDamages: string;
  scoreCpCaptures: string;
  scoreCpDefends: string;
  scoreCpAssists: string;
  scoreCpNeutralizes: string;
  scoreCpNeutralizeAssists: string;
  scoreSuicides: string;
  scoreKills: string;
  scoreTKs: string;
  vehicleType: string;
  kitTemplateName: string;
  kiConnectedAt: string;
  deaths: string;
  score: string;
  vehicleName: string;
  rank: string;
  position: string;
  idleTime: string;
  keyhash: string;
  punished: string;
  timesPunished: string;
  timesForgiven: string;
}

export interface DraftStep {
  pool: Array<PlayersRow>;
  team: 'a' | 'b' | null;
  captain: PlayersRow | null;
}
