
import React, { useMemo } from 'react';
import { PlayerLedger } from '../types';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, BanknotesIcon } from '@heroicons/react/24/solid';

interface PlayerLedgerProps {
  ledger: PlayerLedger;
}

const PlayerLedgerComponent: React.FC<PlayerLedgerProps> = ({ ledger }) => {
  const sortedPlayers = useMemo(() => {
    // Correctly sort by the numeric value (the second element in the entry array)
    return Object.entries(ledger).sort(([, netTotalA], [, netTotalB]) => netTotalB - netTotalA);
  }, [ledger]);

  if (sortedPlayers.length === 0) {
    return (
       <div className="text-center py-16 px-6 bg-gray-800 rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold text-white">Player Ledger is Empty</h3>
        <p className="text-gray-400 mt-2">Complete a game to see player financial summaries.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-white mb-8">Player Ledger</h2>
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <ul className="divide-y divide-gray-700">
          {sortedPlayers.map(([name, netTotal], index) => {
            const isWinner = netTotal > 0;
            const isLoser = netTotal < 0;
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
                  {isWinner ? '+' : ''}${netTotal.toFixed(2)}
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
