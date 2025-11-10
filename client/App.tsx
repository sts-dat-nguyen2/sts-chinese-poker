
import React, { useState, useEffect } from 'react';
import { View, GameOutcome, CreateSessionData, LoginData } from './types';
import { useSession } from './hooks/useSession';
import { useGameState } from './hooks/useGameState';
import SessionSetup from './components/SessionSetup';
import SessionLogin from './components/SessionLogin';
import GameSetup from './components/GameSetup';
import GameFinalization from './components/GameFinalization';
import GameHistory from './components/GameHistory';
import PlayerLedgerComponent from './components/PlayerLedger';
import Header from './components/Header';
import TipModal from './components/TipModal';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.SESSION_SETUP);
  const [lastPlayers, setLastPlayers] = useState<string[]>([]);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);

  const {
    sessionAuth,
    isLoading: sessionLoading,
    error: sessionError,
    clearError: clearSessionError,
    loadSession,
    createSession,
    authenticateCreator,
    viewAsGuest,
    logout,
  } = useSession();

  const {
    currentGame,
    playerLedger,
    potRollover,
    completedGames,
    tipHistory,
    isLoading: gameLoading,
    error: gameError,
    clearError: clearGameError,
    createGame,
    finalizeGame,
    revertGame,
    createTip,
    refreshData,
  } = useGameState(sessionAuth.sessionCode, sessionAuth.isCreator);

  const isLoading = sessionLoading || gameLoading;
  const error = sessionError || gameError;

  // Determine initial view based on session state
  useEffect(() => {
    if (sessionAuth.session && !sessionAuth.isAuthenticated) {
      setCurrentView(View.SESSION_LOGIN);
    } else if (sessionAuth.isAuthenticated && currentGame) {
      setCurrentView(View.FINALIZE);
    } else if (sessionAuth.isAuthenticated) {
      if (sessionAuth.isCreator && completedGames.length === 0) {
        setCurrentView(View.GAME_SETUP);
      } else {
        setCurrentView(View.LEDGER);
      }
    } else {
      setCurrentView(View.SESSION_SETUP);
    }
  }, [sessionAuth, currentGame, completedGames.length]);

  const handleCreateSession = async (sessionData: CreateSessionData) => {
    try {
      clearSessionError();
      await createSession(sessionData);
      // Let the useEffect handle setting the view to LEDGER
    } catch (err) {
      // Error is handled by useSession hook
    }
  };

  const handleJoinSession = async (sessionCode: string) => {
    try {
      clearSessionError();
      await loadSession(sessionCode);
    } catch (err) {
      // Error is handled by useSession hook
    }
  };

  const handleLogin = async (loginData: LoginData) => {
    try {
      clearSessionError();
      await authenticateCreator(loginData);
      // Let the useEffect handle setting the view to LEDGER
    } catch (err) {
      // Error is handled by useSession hook
    }
  };

  const handleViewAsGuest = () => {
    viewAsGuest();
    setCurrentView(View.LEDGER);
  };

  const handleStartGame = async (players: string[], buyIn: number) => {
    try {
      clearGameError();
      setLastPlayers(players);
      await createGame(players, buyIn);
      setCurrentView(View.FINALIZE);
    } catch (err) {
      // Error is handled by useGameState hook
    }
  };

  const handleFinalizeGame = async (outcome: GameOutcome) => {
    if (!currentGame) return;

    try {
      clearGameError();
      await finalizeGame(parseInt(currentGame.id), outcome);
      setCurrentView(View.LEDGER); // Auto-redirect to ledger after finalization
    } catch (err) {
      // Error is handled by useGameState hook
    }
  };
  const handleStartNewGame = () => {
    if (currentGame) {
      setCurrentView(View.FINALIZE);
    } else {
      setCurrentView(View.GAME_SETUP);
    }
  };

  const handleResetData = async () => {
    if (!sessionAuth.isCreator || !sessionAuth.session) return;

    if (window.confirm('Are you sure you want to delete all game history and player ledgers? This action cannot be undone.')) {
      try {
        // We'll need creator credentials for this - for now, just refresh
        await refreshData();
        setCurrentView(View.GAME_SETUP);
      } catch (err) {
        // Error handled by useGameState
      }
    }
  };

  const handleSendTip = async (fromPlayer: string, toPlayer: string, amount: number) => {
    try {
      clearGameError();
      await createTip(fromPlayer, toPlayer, amount);
    } catch (err) {
      // Error handled by useGameState
      throw err;
    }
  };

  const renderView = () => {
    switch (currentView) {
      case View.SESSION_SETUP:
        return (
          <SessionSetup
            onCreateSession={handleCreateSession}
            onJoinSession={handleJoinSession}
            isLoading={isLoading}
            error={error}
          />
        );

      case View.SESSION_LOGIN:
        if (!sessionAuth.session) {
          setCurrentView(View.SESSION_SETUP);
          return null;
        }
        return (
          <SessionLogin
            session={sessionAuth.session}
            onLogin={handleLogin}
            onViewAsGuest={handleViewAsGuest}
            isLoading={isLoading}
            error={error}
          />
        );

      case View.GAME_SETUP:
        return (
          <GameSetup
            onStartGame={handleStartGame}
            potRollover={potRollover}
            lastPlayers={lastPlayers}
            isLoading={isLoading}
            error={error}
          />
        );

      case View.FINALIZE:
        if (currentGame) {
          return <GameFinalization game={currentGame} onFinalize={handleFinalizeGame} />;
        }
        // Fallback if there is no current game
        setCurrentView(View.GAME_SETUP);
        return null;

      case View.HISTORY:
        return <GameHistory games={completedGames} tips={tipHistory} isCreator={sessionAuth.isCreator} onRevertGame={revertGame} />;

      case View.LEDGER:
        return (
          <PlayerLedgerComponent
            ledger={playerLedger}
            isCreator={sessionAuth.isCreator}
            sessionName={sessionAuth.session?.session_name}
          />
        );

      default:
        return (
          <SessionSetup
            onCreateSession={handleCreateSession}
            onJoinSession={handleJoinSession}
            isLoading={isLoading}
            error={error}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="container mx-auto p-4 md:p-8">
        {sessionAuth.isAuthenticated ? (
          <>
            <Header
              activeView={currentView}
              onNavigate={setCurrentView}
              onReset={handleResetData}
              onNewGame={handleStartNewGame}
              onTip={() => setIsTipModalOpen(true)}
              isGameInProgress={!!currentGame}
              isCreator={sessionAuth.isCreator}
              sessionName={sessionAuth.session?.session_name}
              sessionCode={sessionAuth.sessionCode}
              onLogout={logout}
            />
            <main className="mt-8">
              {renderView()}
            </main>
            <TipModal
              isOpen={isTipModalOpen}
              onClose={() => setIsTipModalOpen(false)}
              onSendTip={handleSendTip}
              playerLedger={playerLedger}
            />
          </>
        ) : (
          <main>
            {renderView()}
          </main>
        )}
      </div>
    </div>
  );
};

export default App;
