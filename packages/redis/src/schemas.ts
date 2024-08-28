import { z } from 'zod';
import { GameStatus } from '@bf2-matchmaking/types';

export const matchSchema = z.object({
  state: z.enum([
    'pending',
    'warmup',
    'prelive',
    'live',
    'endlive',
    'finished',
    'stale',
  ] as const),
  roundsPlayed: z.string(),
  pendingSince: z.string().datetime({ offset: true }).optional().nullable(),
  live_at: z.string().datetime({ offset: true }).optional().nullable(),
});

export const rconSchema = z.object({
  address: z.string(),
  port: z.number(),
  pw: z.string(),
});
export const serverInfoSchema = z.object({
  port: z.string(),
  name: z.string(),
  joinmeHref: z.string().url(),
  joinmeDirect: z.string().url(),
  country: z.string(),
  city: z.string(),
  noVehicles: z.boolean().nullable(),
  demos_path: z.string().nullable(),
});
export const serverSchema = z
  .object({
    status: z.string(),
    matchId: z.string(),
    liveAt: z.string().datetime({ offset: true }),
    tickedAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    errorAt: z.string().datetime({ offset: true }),
  })
  .partial();

const playerListItemSchema = z.object({
  index: z.string(),
  getName: z.string(),
  getTeam: z.string(),
  getPing: z.string(),
  isConnected: z.string(),
  isValid: z.string(),
  isRemote: z.string(),
  isAIPlayer: z.string(),
  isAlive: z.string(),
  isManDown: z.string(),
  getProfileId: z.string(),
  isFlagHolder: z.string(),
  getSuicide: z.string(),
  getTimeToSpawn: z.string(),
  getSquadId: z.string(),
  isSquadLeader: z.string(),
  isCommander: z.string(),
  getSpawnGroup: z.string(),
  getAddress: z.string(),
  scoreDamageAssists: z.string(),
  scorePassengerAssists: z.string(),
  scoreTargetAssists: z.string(),
  scoreRevives: z.string(),
  scoreTeamDamages: z.string(),
  scoreTeamVehicleDamages: z.string(),
  scoreCpCaptures: z.string(),
  scoreCpDefends: z.string(),
  scoreCpAssists: z.string(),
  scoreCpNeutralizes: z.string(),
  scoreCpNeutralizeAssists: z.string(),
  scoreSuicides: z.string(),
  scoreKills: z.string(),
  scoreTKs: z.string(),
  vehicleType: z.string(),
  kitTemplateName: z.string(),
  kiConnectedAt: z.string(),
  deaths: z.string(),
  score: z.string(),
  vehicleName: z.string(),
  rank: z.string(),
  position: z.string(),
  idleTime: z.string(),
  keyhash: z.string(),
  punished: z.string(),
  timesPunished: z.string(),
  timesForgiven: z.string(),
});

export const serverLiveSchema = z.object({
  players: z.array(playerListItemSchema),
  version: z.string(),
  currentGameStatus: z.nativeEnum(GameStatus),
  maxPlayers: z.string(),
  connectedPlayers: z.string(),
  joiningPlayers: z.string(),
  currentMapName: z.string(),
  nextMapName: z.string(),
  serverName: z.string(),

  team1_Name: z.string(),
  team1_TicketState: z.string(),
  team1_startTickets: z.string(),
  team1_tickets: z.string(),
  team1_null: z.string(),

  team2_Name: z.string(),
  team2_TicketState: z.string(),
  team2_startTickets: z.string(),
  team2_tickets: z.string(),
  team2_null: z.string(),

  roundTime: z.string(),
  timeLeft: z.string(),
  gameMode: z.string(),
  modDir: z.string(),
  worldSize: z.string(),
  timeLimit: z.string(),
  autoBalanceTeam: z.string(),
  ranked: z.string(),
  team1: z.string(),
  team2: z.string(),
  wallTime: z.string(),
  reservedSlots: z.string(),
});

export const stringArraySchema = z.array(z.string());

export const pendingServerSchema = z.object({
  address: z.string(),
  port: z.string(),
  rcon_port: z.number(),
  rcon_pw: z.string(),
  demos_path: z.string().optional(),
  tries: z.string(),
});
