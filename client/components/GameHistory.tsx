
import React from 'react';
import { Game, GameStatus } from '../types';
import { TrophyIcon, ShieldExclamationIcon, HandRaisedIcon, UserGroupIcon, CalendarDaysIcon, CurrencyDollarIcon, PencilIcon } from '@heroicons/react/24/solid';

interface GameHistoryProps {
  games: Game[];
}

interface StatusBadgeProps {
  status: GameStatus;
  winner?: string;
  potWon: number;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, winner, potWon }) => {
  if (status === GameStatus.DRAW) {
    return (
      <div className="flex items-center space-x-2 text-yellow-300">
        <HandRaisedIcon className="h-6 w-6" />
        <span className="font-bold text-lg">Draw Game</span>
      </div>
    );
  }
  if (status === GameStatus.COMPLETED && winner) {
    return (
      <div className="flex items-center space-x-2 text-green-300">
        <TrophyIcon className="h-6 w-6" />
        <span className="font-semibold text-lg">{winner} Won ${potWon.toFixed(2)}</span>
      </div>
    );
  }
  return null;
};

const GameCard: React.FC<{ game: Game }> = ({ game }) => {
  const potWon = game.buyInAmount * game.players.length + game.potRollover + (game.penalizedPlayers ? game.penalizedPlayers.length * game.buyInAmount * 0.5 : 0);

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-5 transition-all hover:shadow-xl hover:bg-gray-700/50">
      <div className="flex justify-between items-start mb-4">
        <StatusBadge status={game.status} winner={game.winner} potWon={potWon} />
        <div className="flex items-center text-sm text-gray-400">
          <CalendarDaysIcon className="h-4 w-4 mr-1.5" />
          {new Date(game.createdAt).toLocaleDateString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
        <div className="flex items-start">
          <UserGroupIcon className="h-5 w-5 mr-3 mt-1 text-blue-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-200">Players ({game.players.length})</p>
            <p className="text-sm text-gray-400">{game.players.join(', ')}</p>
          </div>
        </div>
        <div className="flex items-start">
          <CurrencyDollarIcon className="h-5 w-5 mr-3 mt-1 text-green-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-200">Buy-In</p>
            <p className="text-sm text-gray-400">${game.buyInAmount.toFixed(2)} per player</p>
          </div>
        </div>
        {game.penalizedPlayers && game.penalizedPlayers.length > 0 && (
          <div className="flex items-start">
            <ShieldExclamationIcon className="h-5 w-5 mr-3 mt-1 text-red-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-200">Penalties Paid By</p>
              <p className="text-sm text-gray-400">{game.penalizedPlayers.join(', ')}</p>
            </div>
          </div>
        )}
         {game.potRollover > 0 && (
          <div className="flex items-start">
            <span className="text-yellow-400 font-bold mr-3 mt-1">$</span>
            <div>
              <p className="font-semibold text-gray-200">Rollover Added</p>
              <p className="text-sm text-gray-400">${game.potRollover.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      {game.notes && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-start text-gray-300">
            <PencilIcon className="h-5 w-5 mr-3 mt-1 text-gray-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-200">Notes</p>
              <p className="text-sm text-gray-400 italic">"{game.notes}"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GameHistory: React.FC<GameHistoryProps> = ({ games }) => {
  if (games.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-gray-800 rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold text-white">No Games Played Yet</h3>
        <p className="text-gray-400 mt-2">Start a new game to see its history here.</p>
      </div>
    );
  }

  return (
    <div>
        <h2 className="text-3xl font-bold text-center text-white mb-8">Game History</h2>
        <div className="space-y-6">
            {games.map(game => <GameCard key={game.id} game={game} />)}
        </div>
    </div>
  );
};

export default GameHistory;