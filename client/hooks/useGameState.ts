// hooks/useGameState.ts
import { useState, useEffect, useCallback } from 'react';
import { Game, PlayerLedger, GameOutcome } from '../types';
import { gameApi, ApiError, SessionState, GameHistoryItem, TipHistoryItem } from '../services/apiService';

export const useGameState = (sessionCode: string | null, isCreator: boolean) => {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [tipHistory, setTipHistory] = useState<TipHistoryItem[]>([]);
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

  // Load tip history
  const loadTipHistory = useCallback(async () => {
    if (!sessionCode) return;

    try {
      const tips = await gameApi.getTipHistory(sessionCode);
      setTipHistory(tips);
    } catch (err) {
      // Don't set error for tips - they're optional
      console.error('Failed to load tip history:', err);
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

  // Revert/delete a game
  const revertGame = async (gameId: number) => {
    if (!sessionCode || !isCreator) {
      setError('Not authorized to revert games');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      await gameApi.revertGame(sessionCode, gameId);

      // Refresh both session state and history
      await Promise.all([loadSessionState(), loadGameHistory()]);

      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to revert game');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a tip from one player to another
  const createTip = async (fromPlayer: string, toPlayer: string, amount: number) => {
    if (!sessionCode || !isCreator) {
      setError('Not authorized to create tips');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      await gameApi.createTip(sessionCode, {
        fromPlayer,
        toPlayer,
        amount,
      });

      // Refresh session state and tip history
      await Promise.all([loadSessionState(), loadTipHistory()]);

      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create tip');
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
      loadTipHistory();
    }
  }, [sessionCode, loadSessionState, loadGameHistory, loadTipHistory]);

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
    tipHistory,
    isLoading,
    error,
    clearError,
    createGame,
    finalizeGame,
    revertGame,
    createTip,
    refreshData: () => Promise.all([loadSessionState(), loadGameHistory(), loadTipHistory()]),
  };
};
