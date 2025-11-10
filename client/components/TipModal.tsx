import React, { useState } from 'react';
import { XMarkIcon, GiftIcon } from '@heroicons/react/24/solid';
import { formatCurrency } from '../utils/currency';
import { PlayerLedger } from '../types';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTip: (fromPlayer: string, toPlayer: string, amount: number) => Promise<void>;
  playerLedger: PlayerLedger;
}

const TipModal: React.FC<TipModalProps> = ({ isOpen, onClose, onSendTip, playerLedger }) => {
  const [fromPlayer, setFromPlayer] = useState('');
  const [toPlayer, setToPlayer] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const players = Object.keys(playerLedger).sort();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fromPlayer || !toPlayer || !amount) {
      setError('All fields are required');
      return;
    }

    if (fromPlayer === toPlayer) {
      setError('Cannot tip yourself');
      return;
    }

    const tipAmount = parseFloat(amount);
    if (isNaN(tipAmount) || tipAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (tipAmount < 1000) {
      setError('Minimum tip amount is 1,000 ₫');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSendTip(fromPlayer, toPlayer, tipAmount);
      // Reset form
      setFromPlayer('');
      setToPlayer('');
      setAmount('');
      onClose();
    } catch (err) {
      setError('Failed to send tip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-600 p-2 rounded-lg">
            <GiftIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Send Tip</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* From Player */}
          <div>
            <label htmlFor="fromPlayer" className="block text-sm font-medium text-gray-300 mb-2">
              From Player
            </label>
            <select
              id="fromPlayer"
              value={fromPlayer}
              onChange={(e) => setFromPlayer(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
              disabled={isSubmitting}
            >
              <option value="">Select player...</option>
              {players.map((player) => (
                <option key={player} value={player}>
                  {player} ({formatCurrency(playerLedger[player])})
                </option>
              ))}
            </select>
          </div>

          {/* To Player */}
          <div>
            <label htmlFor="toPlayer" className="block text-sm font-medium text-gray-300 mb-2">
              To Player
            </label>
            <select
              id="toPlayer"
              value={toPlayer}
              onChange={(e) => setToPlayer(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
              disabled={isSubmitting}
            >
              <option value="">Select player...</option>
              {players.map((player) => (
                <option key={player} value={player} disabled={player === fromPlayer}>
                  {player} ({formatCurrency(playerLedger[player])})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
              Amount (₫)
            </label>
            <input
              type="text"
              id="amount"
              value={amount}
              onChange={handleAmountChange}
              placeholder="e.g., 5000"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-400">
              Minimum: 1,000 ₫ | Step: 1,000 ₫
            </p>
            {amount && (
              <p className="mt-1 text-sm text-green-400">
                Tip amount: {formatCurrency(parseFloat(amount) || 0)}
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Tip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TipModal;
