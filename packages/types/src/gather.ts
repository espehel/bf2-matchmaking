export enum GatherStatus {
  Queueing,
  Summoning,
  Playing,
  Reseting,
  Failed,
}

export interface GatherState extends Record<string, string | number | undefined> {
  status: number;
  matchId: string | undefined;
}
