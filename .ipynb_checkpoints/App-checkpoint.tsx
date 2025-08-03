
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Game, PlayerLedger, View, GameOutcome, GameStatus } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import GameSetup from './components/GameSetup';
import GameFinalization from './components/GameFinalization';
import GameHistory from './components/GameHistory';
import PlayerLedgerComponent from './components/PlayerLedger';
import Header from './components/Header';
import { calculateLedger, calculateRollover } from './services/ledgerService';

const App: React.FC = () => {
  const [games, setGames] = useLocalStorage<Game[]>('gameNightLedger:games', []);
  const [currentView, setCurrentView] = useState<View>(View.SETUP);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  const potRollover = useMemo(() => calculateRollover(games), [games]);
  const playerLedger: PlayerLedger = useMemo(() => calculateLedger(games), [games]);
  
  const completedGames = useMemo(() => games.filter(g => g.status !== GameStatus.IN_PROGRESS).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [games]);

  useEffect(() => {
    // If all games are deleted, reset to the setup screen
    const activeGame = games.find(g => g.id === currentGame?.id);
    if (games.length === 0) {
      setCurrentView(View.SETUP);
      setCurrentGame(null);
    } else if (currentGame && !activeGame) {
      // If the current game in progress was deleted (e.g. via reset), go back to setup
      setCurrentView(View.SETUP);
      setCurrentGame(null);
    }
  }, [games, currentGame]);

  const handleStartGame = useCallback((players: string[], buyIn: number) => {
    const newGame: Game = {
      id: Date.now().toString(),
      players,
      buyInAmount: buyIn,
      potRollover,
      status: GameStatus.IN_PROGRESS,
      createdAt: new Date().toISOString(),
    };
    setCurrentGame(newGame);
    setGames(prevGames => [...prevGames, newGame]);
    setCurrentView(View.FINALIZE);
  }, [potRollover, setGames]);

  const handleFinalizeGame = useCallback((outcome: GameOutcome) => {
    if (!currentGame) return;

    setGames(prevGames =>
      prevGames.map(game =>
        game.id === currentGame.id ? { ...game, ...outcome } : game
      )
    );
    setCurrentGame(null);
    setCurrentView(View.HISTORY);
  }, [currentGame, setGames]);
  
  const handleStartNewGame = useCallback(() => {
    const inProgressGame = games.find(g => g.status === GameStatus.IN_PROGRESS);
    if (inProgressGame) {
      setCurrentGame(inProgressGame);
      setCurrentView(View.FINALIZE);
    } else {
      setCurrentGame(null);
      setCurrentView(View.SETUP);
    }
  }, [games]);

  const handleResetData = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all game history and player ledgers? This action cannot be undone.')) {
      setGames([]);
      setCurrentGame(null);
      setCurrentView(View.SETUP);
    }
  }, [setGames]);

  const renderView = () => {
    switch (currentView) {
      case View.HISTORY:
        return <GameHistory games={completedGames} />;
      case View.LEDGER:
        return <PlayerLedgerComponent ledger={playerLedger} />;
      case View.FINALIZE:
        if (currentGame) {
          return <GameFinalization game={currentGame} onFinalize={handleFinalizeGame} />;
        }
        // Fallback if there is no current game
        setCurrentView(View.SETUP);
        return <GameSetup onStartGame={handleStartGame} potRollover={potRollover} />;
      case View.SETUP:
      default:
        return <GameSetup onStartGame={handleStartGame} potRollover={potRollover} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <Header 
          activeView={currentView} 
          onNavigate={setCurrentView} 
          onReset={handleResetData}
          onNewGame={handleStartNewGame}
          isGameInProgress={!!games.find(g => g.status === GameStatus.IN_PROGRESS)}
        />
        <main className="mt-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
