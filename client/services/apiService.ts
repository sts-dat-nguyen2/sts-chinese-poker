// services/apiService.ts

// Use environment-aware API URL
const isDevelopment = window.location.hostname === 'localhost';

const API_BASE_URL = isDevelopment
  ? 'http://localhost:3001/api'
  : `http://${window.location.hostname}:3001/api`;

// Types for API requests/responses
export interface CreateSessionRequest {
  sessionName: string;
  creatorName: string;
  creatorPassword: string;
}

export interface CreateSessionResponse {
  session: {
    id: number;
    session_name: string;
    session_code: string;
    creator_name: string;
    created_at: string;
  };
  shareableUrl: string;
}

export interface AuthenticateRequest {
  creatorName: string;
  creatorPassword: string;
}

export interface AuthenticateResponse {
  authenticated: boolean;
  session: {
    id: number;
    session_name: string;
    session_code: string;
    creator_name: string;
  };
  role: string;
}

export interface SessionInfo {
  id: number;
  session_name: string;
  session_code: string;
  creator_name: string;
  created_at: string;
}

export interface CreateGameRequest {
  players: string[];
  buyInAmount: number;
  potRollover?: number;
}

export interface FinalizeGameRequest {
  status: 'completed' | 'draw';
  winner?: string;
  penalizedPlayers?: string[];
  notes?: string;
}

export interface CreateTipRequest {
  fromPlayer: string;
  toPlayer: string;
  amount: number;
}

export interface SessionState {
  currentGame: any | null;
  playerLedger: { [playerName: string]: number };
  potRollover: number;
}

export interface PlayerOutcome {
  name: string;
  amount: number;
}

export interface GameHistoryItem {
  id: number;
  createdAt: string;
  status: string;
  players: string[];
  buyInAmount: number;
  potRollover: number;
  winner: string;
  pot: number;
  notes?: string;
  penalizedPlayers?: string[];
  outcomes: PlayerOutcome[];
}

export interface TipHistoryItem {
  created_at: string;
  from_player: string;
  to_player: string;
  amount: number;
}

// API Error class
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'An error occurred');
  }
  return data;
};

// Session Management
export const sessionApi = {
  // Create a new session
  async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse(response);
  },

  // Get session info
  async getSession(sessionCode: string): Promise<SessionInfo> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionCode}`);
    return handleResponse(response);
  },

  // Authenticate creator
  async authenticateCreator(sessionCode: string, request: AuthenticateRequest): Promise<AuthenticateResponse> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionCode}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse(response);
  },

  // Reset session data
  async resetSessionData(sessionCode: string, creatorName: string, creatorPassword: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionCode}/data`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorName, creatorPassword }),
    });
    return handleResponse(response);
  },
};

// Game Management
export const gameApi = {
  // Get session state (current game + ledger + rollover)
  async getSessionState(sessionCode: string): Promise<SessionState> {
    const response = await fetch(`${API_BASE_URL}/games/${sessionCode}/state`);
    return handleResponse(response);
  },

  // Get game history
  async getGameHistory(sessionCode: string): Promise<GameHistoryItem[]> {
    const response = await fetch(`${API_BASE_URL}/games/${sessionCode}/history`);
    return handleResponse(response);
  },

  // Create a new game
  async createGame(sessionCode: string, request: CreateGameRequest): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/games/${sessionCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse(response);
  },

  // Finalize a game
  async finalizeGame(sessionCode: string, gameId: number, request: FinalizeGameRequest): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/games/${sessionCode}/${gameId}/finalize`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse(response);
  },

  // Revert/delete a game
  async revertGame(sessionCode: string, gameId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/games/${sessionCode}/${gameId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Create a tip from one player to another
  async createTip(sessionCode: string, request: CreateTipRequest): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/games/${sessionCode}/tip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse(response);
  },

  // Get tip history
  async getTipHistory(sessionCode: string): Promise<TipHistoryItem[]> {
    const response = await fetch(`${API_BASE_URL}/games/${sessionCode}/tips`);
    return handleResponse(response);
  },
};
