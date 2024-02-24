import { MatchPlayersInsert } from '@bf2-matchmaking/types';

export const isTeam = (team: number) => (mp: MatchPlayersInsert) => mp.team === team;
