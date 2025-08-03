
export enum View {
  SETUP = 'setup',
  FINALIZE = 'finalize',
  HISTORY = 'history',
  LEDGER = 'ledger'
}

export enum GameStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DRAW = 'draw'
}

export enum OutcomeType {
  WINNER_ONLY = 'winner_only',
  WINNER_WITH_PENALTY = 'winner_with_penalty',
  DRAW = 'draw'
}

export interface Game {
  id: string;
  players: string[];
  buyInAmount: number;
  potRollover: number;
  status: GameStatus;
  createdAt: string;
  winner?: string;
  penalizedPlayers?: string[];
  notes?: string;
}

export interface GameOutcome {
  status: GameStatus;
  winner?: string;
  penalizedPlayers?: string[];
  notes?: string;
}

export interface PlayerLedger {
  [playerName: string]: number;
}