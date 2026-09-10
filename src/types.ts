export type BowlerPosition = 'skip' | 'second' | 'lead';

export interface Player {
  id: string;
  name: string;
  bowlerNumber: number;
  position: BowlerPosition;
  rolePreference?: 'lead' | 'second' | 'skip' | 'any';
}

export interface Team {
  id: string;
  name: string;
  color?: string;
  lead: Player;
  second?: Player | null;
  skip: Player;
}

export interface Rink {
  id: string;
  rinkNumber: number;
  teamA: Team;
  teamB: Team;
}

export interface RoundDraw {
  roundNumber: number; // 1, 2, 3
  rinks: Rink[];
}

export interface DrawMetrics {
  uniqueTeammatesPercent: number;
  uniquePositionalOpponentsPercent: number;
  rinkDiversityPercent: number;
  repeatTeammatePairsCount: number;
  repeatPositionalOpponentPairsCount: number;
  maxRinkVisitsPerPlayer: number;
}

export interface TournamentDraw {
  playerCount: number;
  rinkCount: number;
  rounds: RoundDraw[];
  metrics: DrawMetrics;
  keepPair?: boolean;
}

export interface DrawConfig {
  playerCount: number;
  rinkCount: number;
  balanceRoles: boolean;
}
