export type BowlerPosition = 'lead' | 'second' | 'skip';

export interface Player {
  id: string;
  name: string;
  rolePreference?: 'lead' | 'second' | 'skip' | 'any';
}

export interface Team {
  id: string;
  name: string;
  color: 'red' | 'blue' | 'yellow' | 'green';
  lead: Player;
  second: Player;
  skip: Player;
}

export interface Rink {
  id: string;
  rinkNumber: number;
  teamA: Team;
  teamB: Team;
}

export interface DrawConfig {
  playerCount: number;
  rinkCount: number;
  balanceRoles: boolean;
}
