// hooks/useGameState.ts
import { useState, useEffect, useCallback } from 'react';
import { Game, PlayerLedger, GameOutcome } from '../types';
import { gameApi, ApiError, SessionState, GameHistoryItem } from '../services/apiService';

export const useGameState = (sessionCode: string | null, isCreator: boolean) => {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Load session state (current game + ledger + rollover)
  const loadSessionState = useCallback(async () => {
    if (!sessionCode) return;

    setIsLoading(true);
    clearError();

    try {
      const state = await gameApi.getSessionState(sessionCode);
      setSessionState(state);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load session state');
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionCode]);

  // Load game history
  const loadGameHistory = useCallback(async () => {
    if (!sessionCode) return;

    setIsLoading(true);
    clearError();

    try {
      const history = await gameApi.getGameHistory(sessionCode);
      setGameHistory(history);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load game history');
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionCode]);

  // Create a new game
  const createGame = async (players: string[], buyInAmount: number) => {
    if (!sessionCode || !isCreator) {
      setError('Not authorized to create games');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const potRollover = sessionState?.potRollover || 0;
      const game = await gameApi.createGame(sessionCode, {
        players,
        buyInAmount,
        potRollover,
      });

      // Refresh session state to get the new current game
      await loadSessionState();

      return game;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create game');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Finalize a game
  const finalizeGame = async (gameId: number, outcome: GameOutcome) => {
    if (!sessionCode || !isCreator) {
      setError('Not authorized to finalize games');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      await gameApi.finalizeGame(sessionCode, gameId, {
        status: outcome.status,
        winner: outcome.winner,
        penalizedPlayers: outcome.penalizedPlayers,
        notes: outcome.notes,
      });

      // Refresh both session state and history
      await Promise.all([loadSessionState(), loadGameHistory()]);

      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to finalize game');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load when sessionCode becomes available
  useEffect(() => {
    if (sessionCode) {
      loadSessionState();
      loadGameHistory();
    }
  }, [sessionCode, loadSessionState, loadGameHistory]);

  // Derived values for compatibility with existing components
  const currentGame: Game | null = sessionState?.currentGame ? {
    id: sessionState.currentGame.id.toString(),
    players: sessionState.currentGame.players || [],
    buyInAmount: Number(sessionState.currentGame.buy_in_amount) || 0,
    potRollover: Number(sessionState.currentGame.pot_rollover) || 0,
    status: sessionState.currentGame.status,
    createdAt: sessionState.currentGame.created_at,
    potWon: 0, // Not applicable for in-progress game
    outcomes: [], // Not applicable for in-progress game
  } : null;

  // Ensure playerLedger values are proper numbers
  const playerLedger: PlayerLedger = sessionState?.playerLedger
    ? Object.fromEntries(
        Object.entries(sessionState.playerLedger).map(([name, value]) => [
          name,
          Number(value) || 0
        ])
      )
    : {};

  const potRollover: number = Number(sessionState?.potRollover) || 0;

  // Convert game history to the format expected by existing components
  const completedGames: Game[] = gameHistory.map((item: GameHistoryItem): Game => ({
    id: item.id.toString(),
    players: item.players,
    buyInAmount: Number(item.buyInAmount) || 0,
    potRollover: Number(item.potRollover) || 0,
    status: item.status as any,
    createdAt: item.createdAt,
    winner: item.winner === 'Draw Game' ? undefined : item.winner,
    penalizedPlayers: item.penalizedPlayers || [],
    notes: item.notes,
    potWon: Number(item.pot) || 0,
    outcomes: (item.outcomes || []).map(o => ({ ...o, amount: Number(o.amount) || 0 })),
  }));

  return {
    currentGame,
    playerLedger,
    potRollover,
    completedGames,
    isLoading,
    error,
    clearError,
    createGame,
    finalizeGame,
    refreshData: () => Promise.all([loadSessionState(), loadGameHistory()]),
  };
};
