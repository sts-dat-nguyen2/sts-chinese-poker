import React, { useState } from 'react';
import { Game, GameStatus, PlayerOutcome } from '../types';
import { TipHistoryItem } from '../services/apiService';
import {
  TrophyIcon,
  ShieldExclamationIcon,
  HandRaisedIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  PencilIcon,
  ChevronDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  ScaleIcon,
  TrashIcon,
  GiftIcon
} from '@heroicons/react/24/solid';
import { formatCurrency } from '../utils/currency';

interface GameHistoryProps {
  games: Game[];
  tips: TipHistoryItem[];
  isCreator?: boolean;
  onRevertGame?: (gameId: number) => Promise<void>;
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
        <span className="font-semibold text-lg">{winner} Won {formatCurrency(potWon)}</span>
      </div>
    );
  }
  return null;
};

const GameCardDetails: React.FC<{ game: Game }> = ({ game }) => {
    const totalBuyIn = game.buyInAmount * game.players.length;
    const totalPenalties = (game.penalizedPlayers?.length || 0) * game.buyInAmount * 0.5;

    return (
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
            <div>
                <h4 className="text-md font-semibold text-gray-200 flex items-center mb-2">
                    <ScaleIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Pot Calculation
                </h4>
                <div className="space-y-1 text-sm text-gray-400 pl-7">
                    <p>Total Buy-ins: {formatCurrency(totalBuyIn)} ({game.players.length} players)</p>
                    {game.potRollover > 0 && <p>Pot Rollover: {formatCurrency(game.potRollover)}</p>}
                    {totalPenalties > 0 && <p>Penalties Added: {formatCurrency(totalPenalties)}</p>}
                    <p className="font-bold text-green-400">Total Pot Won: {formatCurrency(game.potWon)}</p>
                </div>
            </div>
            <div>
                <h4 className="text-md font-semibold text-gray-200 flex items-center mb-2">
                    <ReceiptPercentIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Player Outcomes
                </h4>
                <ul className="space-y-2 pl-7">
                    {game.outcomes.sort((a, b) => b.amount - a.amount).map(outcome => {
                        const isWinner = outcome.amount > 0;
                        const Icon = isWinner ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
                        const color = isWinner ? 'text-green-400' : 'text-red-400';
                        return (
                            <li key={outcome.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <Icon className={`h-4 w-4 mr-2 ${color}`} />
                                    <span className="font-medium text-gray-300">{outcome.name}</span>
                                </div>
                                <span className={`font-bold ${color}`}>
                                    {isWinner ? '+' : ''}{formatCurrency(outcome.amount)}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

const GameCard: React.FC<{ game: Game; isCreator?: boolean; onRevert?: (gameId: number) => Promise<void> }> = ({ game, isCreator, onRevert }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRevert = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to revert this game? This will delete the game and all its transactions. This action cannot be undone.`)) {
      if (onRevert) {
        await onRevert(parseInt(game.id));
      }
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-5 transition-all hover:shadow-xl hover:bg-gray-700/50">
      <div className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex justify-between items-start mb-4">
          <StatusBadge status={game.status} winner={game.winner} potWon={game.potWon} />
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-4 w-4 mr-1.5" />
              {new Date(game.createdAt).toLocaleDateString()}
            </div>
            {isCreator && onRevert && (
              <button
                onClick={handleRevert}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
                title="Revert this game"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Revert
              </button>
            )}
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
            <BanknotesIcon className="h-5 w-5 mr-3 mt-1 text-green-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-200">Buy-In</p>
              <p className="text-sm text-gray-400">{formatCurrency(game.buyInAmount)} per player</p>
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
              <BanknotesIcon className="h-5 w-5 mr-3 mt-1 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-200">Rollover Added</p>
                <p className="text-sm text-gray-400">{formatCurrency(game.potRollover)}</p>
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
        <div className="flex justify-center mt-4">
            <ChevronDownIcon className={`h-6 w-6 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {isExpanded && <GameCardDetails game={game} />}
    </div>
  );
};

const TipCard: React.FC<{ tip: TipHistoryItem }> = ({ tip }) => {
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-4 transition-all hover:shadow-xl hover:bg-gray-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-600/20 p-2 rounded-lg">
            <GiftIcon className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-green-300">{tip.from_player}</span>
              {' → '}
              <span className="font-semibold text-blue-300">{tip.to_player}</span>
            </p>
            <p className="text-xs text-gray-500">
              {new Date(tip.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-400">{formatCurrency(Number(tip.amount))}</p>
        </div>
      </div>
    </div>
  );
};

const GameHistory: React.FC<GameHistoryProps> = ({ games, tips, isCreator, onRevertGame }) => {
  const hasGames = games.length > 0;
  const hasTips = tips.length > 0;

  if (!hasGames && !hasTips) {
    return (
      <div className="text-center py-16 px-6 bg-gray-800 rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold text-white">No History Yet</h3>
        <p className="text-gray-400 mt-2">Start a new game or send a tip to see history here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {hasGames && (
        <div>
          <h2 className="text-3xl font-bold text-center text-white mb-8">Game History</h2>
          <div className="space-y-6">
            {games.map(game => <GameCard key={game.id} game={game} isCreator={isCreator} onRevert={onRevertGame} />)}
          </div>
        </div>
      )}

      {hasTips && (
        <div>
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            <span className="flex items-center justify-center gap-2">
              <GiftIcon className="h-8 w-8 text-green-400" />
              Tip History
            </span>
          </h2>
          <div className="space-y-3">
            {tips.map((tip, index) => <TipCard key={`${tip.from_player}-${tip.to_player}-${tip.created_at}-${index}`} tip={tip} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHistory;
