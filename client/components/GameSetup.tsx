
import React, { useState, useCallback } from 'react';
import { PlusIcon, TrashIcon, UserGroupIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';

interface GameSetupProps {
  onStartGame: (players: string[], buyIn: number) => void;
  potRollover: number;
  lastPlayers: string[];
}

const GameSetup: React.FC<GameSetupProps> = ({ onStartGame, potRollover, lastPlayers }) => {
  const [players, setPlayers] = useState<string[]>(lastPlayers.length > 0 ? lastPlayers : ['', '']);
  const [buyIn, setBuyIn] = useState<string>('10');
  const [error, setError] = useState<string>('');

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    setPlayers([...players, '']);
  };

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
    }
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validatedPlayers = players.map(p => p.trim()).filter(p => p.length > 0);
    
    if (validatedPlayers.length < 2) {
      setError('Please enter at least two players.');
      return;
    }
    
    const uniquePlayers = new Set(validatedPlayers);
    if (uniquePlayers.size !== validatedPlayers.length) {
      setError('Player names must be unique.');
      return;
    }

    const buyInAmount = parseFloat(buyIn);
    if (isNaN(buyInAmount) || buyInAmount <= 0) {
      setError('Please enter a valid buy-in amount greater than zero.');
      return;
    }

    onStartGame(validatedPlayers, buyInAmount);
  }, [players, buyIn, onStartGame]);

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8">
      <h2 className="text-3xl font-bold text-center text-white mb-2">Start a New Game</h2>
      <p className="text-center text-gray-400 mb-8">Enter player names and the buy-in amount to begin.</p>
      
      {potRollover > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-center p-3 rounded-lg mb-6">
          <p>A rollover of <span className="font-bold">${potRollover.toFixed(2)}</span> from the last draw will be added to this game's pot.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center text-lg font-medium text-gray-300 mb-2">
            <UserGroupIcon className="h-6 w-6 mr-2 text-blue-400" />
            Players
          </label>
          <div className="space-y-3">
            {players.map((player, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={player}
                  onChange={(e) => handlePlayerChange(index, e.target.value)}
                  placeholder={`Player ${index + 1}`}
                  className="w-full bg-gray-900 border-2 border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => removePlayer(index)}
                  disabled={players.length <= 2}
                  className="p-3 bg-red-600/20 text-red-400 rounded-md hover:bg-red-600/40 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addPlayer}
            className="flex items-center space-x-2 mt-4 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-blue-600/20 text-blue-300 hover:bg-blue-600/40"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Player</span>
          </button>
        </div>

        <div>
           <label htmlFor="buy-in" className="flex items-center text-lg font-medium text-gray-300 mb-2">
            <CurrencyDollarIcon className="h-6 w-6 mr-2 text-green-400" />
            Buy-In Amount (per player)
          </label>
          <div className="relative">
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-400 sm:text-sm">$</span>
            </div>
            <input
              id="buy-in"
              type="number"
              value={buyIn}
              onChange={(e) => setBuyIn(e.target.value)}
              step="0.01"
              min="0.01"
              className="w-full bg-gray-900 border-2 border-gray-700 rounded-md p-3 pl-7 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-md">{error}</p>}

        <button
          type="submit"
          className="w-full bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 text-lg"
        >
          Start Game
        </button>
      </form>
    </div>
  );
};

export default GameSetup;
