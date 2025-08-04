
import React, { useState, useMemo } from 'react';
import { Game, GameOutcome, GameStatus, OutcomeType } from '../types';
import { TrophyIcon, ShieldExclamationIcon, HandRaisedIcon, PencilIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { formatCurrency } from '../utils/currency';

interface GameFinalizationProps {
  game: Game;
  onFinalize: (outcome: GameOutcome) => void;
}

interface OutcomeOptionProps {
    value: OutcomeType;
    label: string;
    icon: React.ReactNode;
    current: OutcomeType;
    onChange: (value: OutcomeType) => void;
}

const OutcomeOption: React.FC<OutcomeOptionProps> = ({ value, label, icon, current, onChange }) => (
    <label className={`flex-1 p-4 rounded-lg cursor-pointer transition-all duration-200 text-center border-2 ${current === value ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}>
        <input type="radio" name="outcome" value={value} className="sr-only" onChange={e => onChange(e.target.value as OutcomeType)} checked={current === value} />
        <div className="flex flex-col items-center space-y-2">
            {icon}
            <span className="font-medium">{label}</span>
        </div>
    </label>
);


const GameFinalization: React.FC<GameFinalizationProps> = ({ game, onFinalize }) => {
  const [outcomeType, setOutcomeType] = useState<OutcomeType>(OutcomeType.WINNER_ONLY);
  const [winner, setWinner] = useState<string>('');
  const [penalizedPlayers, setPenalizedPlayers] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const totalPot = useMemo(() => game.players.length * game.buyInAmount + game.potRollover, [game]);
  const penaltyAmount = useMemo(() => game.buyInAmount * 0.5, [game.buyInAmount]);
  const winnerPot = useMemo(() => totalPot + (outcomeType === OutcomeType.WINNER_WITH_PENALTY ? penalizedPlayers.length * penaltyAmount : 0), [totalPot, penaltyAmount, outcomeType, penalizedPlayers]);

  const availablePenalizedPlayers = useMemo(() => game.players.filter(p => p !== winner), [game.players, winner]);

  const handleTogglePenalized = (playerName: string) => {
    setPenalizedPlayers(prev =>
      prev.includes(playerName)
        ? prev.filter(p => p !== playerName)
        : [...prev, playerName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let finalOutcome: GameOutcome;

    switch (outcomeType) {
      case OutcomeType.WINNER_ONLY:
        if (!winner) {
          setError('Please select a winner.');
          return;
        }
        finalOutcome = { status: GameStatus.COMPLETED, winner, notes };
        break;

      case OutcomeType.WINNER_WITH_PENALTY:
        if (!winner) {
          setError('Please select a winner.');
          return;
        }
        if (penalizedPlayers.length === 0) {
            setError('Please select at least one penalized player.');
            return;
        }
        finalOutcome = { status: GameStatus.COMPLETED, winner, penalizedPlayers, notes };
        break;

      case OutcomeType.DRAW:
        finalOutcome = { status: GameStatus.DRAW, notes };
        break;

      default:
          return;
    }
    onFinalize(finalOutcome);
  };


  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8">
      <h2 className="text-3xl font-bold text-center text-white mb-2">Finalize Game</h2>
      <p className="text-center text-gray-400 mb-8">Declare the outcome of the game.</p>

      <div className="bg-gray-900 p-4 rounded-lg mb-6 text-center">
        <p className="text-gray-400">Total Pot</p>
        <p className="text-4xl font-bold text-green-400">{formatCurrency(totalPot)}</p>
        {game.potRollover > 0 && <p className="text-sm text-yellow-400">(includes {formatCurrency(game.potRollover)} rollover)</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-lg font-medium text-gray-300 mb-3 block">Game Outcome</label>
          <div className="flex space-x-2 md:space-x-4">
              <OutcomeOption value={OutcomeType.WINNER_ONLY} label="Single Winner" icon={<TrophyIcon className="h-8 w-8"/>} current={outcomeType} onChange={setOutcomeType} />
              <OutcomeOption value={OutcomeType.WINNER_WITH_PENALTY} label="Winner + Penalty" icon={<ShieldExclamationIcon className="h-8 w-8"/>} current={outcomeType} onChange={setOutcomeType} />
              <OutcomeOption value={OutcomeType.DRAW} label="Draw" icon={<HandRaisedIcon className="h-8 w-8"/>} current={outcomeType} onChange={setOutcomeType} />
          </div>
        </div>

        {outcomeType !== OutcomeType.DRAW && (
          <div>
            <label className="text-lg font-medium text-gray-300 mb-3 block">Winner</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {game.players.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setWinner(p); setPenalizedPlayers([]); }}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center space-y-2 transition-all duration-200 text-white ${
                    winner === p
                      ? 'bg-blue-600 border-blue-400 shadow-lg scale-105'
                      : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-blue-500'
                  }`}
                >
                  <UserCircleIcon className="h-12 w-12" />
                  <span className="font-semibold text-center break-words w-full">{p}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {outcomeType === OutcomeType.WINNER_WITH_PENALTY && winner && (
          <div>
            <label className="text-lg font-medium text-gray-300 mb-3 block">Penalized Players</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {availablePenalizedPlayers.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleTogglePenalized(p)}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center space-y-2 transition-all duration-200 text-white ${
                    penalizedPlayers.includes(p)
                      ? 'bg-red-600 border-red-400 shadow-lg scale-105'
                      : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-red-500'
                  }`}
                >
                  <UserCircleIcon className="h-12 w-12" />
                  <span className="font-semibold text-center break-words w-full">{p}</span>
                </button>
              ))}
            </div>
            <p className="text-sm text-yellow-400 mt-2">Each penalized player pays an extra {formatCurrency(penaltyAmount)} to the winner.</p>
          </div>
        )}

                {outcomeType !== OutcomeType.DRAW && winner && (
             <div className="bg-green-900/50 p-4 rounded-lg text-center">
                <p className="text-green-300 font-medium">{winner} wins</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(winnerPot)}</p>
                {penalizedPlayers.length > 0 && outcomeType === OutcomeType.WINNER_WITH_PENALTY && (
                    <p className="text-sm text-green-200">
                        ({formatCurrency(totalPot)} pot + {formatCurrency(penalizedPlayers.length * penaltyAmount)} from penalties)
                    </p>
                )}
            </div>
        )}

        {outcomeType === OutcomeType.DRAW && (
            <div className="bg-yellow-900/50 p-4 rounded-lg text-center">
                <p className="text-yellow-300 font-medium">Pot rolls over to next game</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalPot)}</p>
            </div>
        )}

        <div>
           <label htmlFor="notes" className="flex items-center text-lg font-medium text-gray-300 mb-2">
            <PencilIcon className="h-5 w-5 mr-2 text-gray-400" />
            Notes (Optional)
          </label>
          <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="e.g., Alice won with a straight." className="w-full bg-gray-700 border-2 border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"></textarea>
        </div>

        {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-md">{error}</p>}

        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 text-lg">
          Finalize & Save Game
        </button>
      </form>
    </div>
  );
};

export default GameFinalization;
