
import React, { useMemo } from 'react';
import { PlayerLedger } from '../types';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, BanknotesIcon } from '@heroicons/react/24/solid';
import { formatCurrency } from '../utils/currency';

interface PlayerLedgerProps {
  ledger: PlayerLedger;
  isCreator?: boolean;
  sessionName?: string;
}

const PlayerLedgerComponent: React.FC<PlayerLedgerProps> = ({ ledger, isCreator = false, sessionName }) => {
  const sortedPlayers = useMemo(() => {
    // Correctly sort by the numeric value (the second element in the entry array)
    return Object.entries(ledger).sort(([, netTotalA], [, netTotalB]) => netTotalB - netTotalA);
  }, [ledger]);

  if (sortedPlayers.length === 0) {
    return (
       <div className="text-center py-16 px-6 bg-gray-800 rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold text-white">
          {sessionName ? `${sessionName} - Ledger` : 'Player Ledger'}
        </h3>
        <div className="mt-6 space-y-4">
          <p className="text-gray-400">No games completed yet in this session.</p>
          {isCreator ? (
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mt-4">
              <p className="text-blue-300 text-sm">
                🎮 <strong>Ready to start?</strong> Use the "New Game" button to create your first game!
              </p>
            </div>
          ) : (
            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mt-4">
              <p className="text-green-300 text-sm">
                👥 <strong>Viewing as guest.</strong> Game results will appear here once the creator starts games.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-white mb-8">Player Ledger</h2>
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <ul className="divide-y divide-gray-700">
          {sortedPlayers.map(([name, netTotal], index) => {
            // Ensure netTotal is a valid number
            const safeNetTotal = Number(netTotal) || 0;
            const isWinner = safeNetTotal > 0;
            const isLoser = safeNetTotal < 0;
            const netColor = isWinner ? 'text-green-400' : isLoser ? 'text-red-400' : 'text-gray-300';
            const Icon = isWinner ? ArrowTrendingUpIcon : isLoser ? ArrowTrendingDownIcon : BanknotesIcon;

            return (
              <li key={name} className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center space-x-4">
                    <span className={`w-8 text-center font-bold text-lg ${index < 3 ? 'text-yellow-400' : 'text-gray-400'}`}>{index + 1}</span>
                    <Icon className={`h-6 w-6 ${netColor}`} />
                    <span className="font-medium text-lg text-white">{name}</span>
                </div>
                <span className={`font-bold text-xl ${netColor}`}>
                  {isWinner ? '+' : ''}{formatCurrency(safeNetTotal)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PlayerLedgerComponent;
