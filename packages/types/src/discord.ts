import { MatchStatus } from './database-types';

export interface PubobotMatch extends Record<string, string | number> {
  id: number;
  status: MatchStatus;
  matchId: number;
  channelId: string;
}
