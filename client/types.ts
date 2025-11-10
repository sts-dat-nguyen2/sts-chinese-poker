
export enum View {
  SESSION_SETUP = 'session_setup',
  SESSION_LOGIN = 'session_login',
  GAME_SETUP = 'game_setup',
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

export interface PlayerOutcome {
  name: string;
  amount: number;
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
  potWon: number;
  outcomes: PlayerOutcome[];
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

export interface Session {
  id: number;
  session_name: string;
  session_code: string;
  creator_name: string;
  created_at: string;
}

export interface SessionAuth {
  isAuthenticated: boolean;
  isCreator: boolean;
  session: Session | null;
  sessionCode: string | null;
}

export interface CreateSessionData {
  sessionName: string;
  creatorName: string;
  creatorPassword: string;
}

export interface LoginData {
  creatorName: string;
  creatorPassword: string;
}
