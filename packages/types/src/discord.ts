import { MatchStatus } from './database-types';

export interface PubobotMatch extends Record<string, string | number> {
  status: MatchStatus;
  matchId: number;
}
