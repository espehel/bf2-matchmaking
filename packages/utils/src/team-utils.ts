import { MatchPlayersRow } from '@bf2-matchmaking/types';

export const isTeam = (team: number) => (mp: MatchPlayersRow) => mp.team === team;
