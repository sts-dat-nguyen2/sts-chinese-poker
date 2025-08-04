// components/SessionSetup.tsx
import React, { useState } from 'react';
import { CreateSessionData } from '../types';

interface SessionSetupProps {
  onCreateSession: (sessionData: CreateSessionData) => void;
  onJoinSession: (sessionCode: string) => void;
  isLoading?: boolean;
  error?: string;
}

const SessionSetup: React.FC<SessionSetupProps> = ({
  onCreateSession,
  onJoinSession,
  isLoading = false,
  error
}) => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [sessionData, setSessionData] = useState<CreateSessionData>({
    sessionName: '',
    creatorName: '',
    creatorPassword: ''
  });
  const [joinCode, setJoinCode] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionData.sessionName.trim() && sessionData.creatorName.trim() && sessionData.creatorPassword.trim()) {
      onCreateSession(sessionData);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      onJoinSession(joinCode.trim());
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-gray-800 rounded-2xl shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">🏆 Game Night Ledger</h1>
        <p className="text-gray-300">Track your Chinese Poker games</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => setMode('create')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            mode === 'create'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Create Session
        </button>
        <button
          onClick={() => setMode('join')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            mode === 'join'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Join Session
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {mode === 'create' ? (
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Name
            </label>
            <input
              type="text"
              value={sessionData.sessionName}
              onChange={(e) => setSessionData(prev => ({ ...prev, sessionName: e.target.value }))}
              placeholder="e.g., Friday Night Poker"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Name (Creator)
            </label>
            <input
              type="text"
              value={sessionData.creatorName}
              onChange={(e) => setSessionData(prev => ({ ...prev, creatorName: e.target.value }))}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Creator Password
            </label>
            <input
              type="password"
              value={sessionData.creatorPassword}
              onChange={(e) => setSessionData(prev => ({ ...prev, creatorPassword: e.target.value }))}
              placeholder="Choose a password"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              This password allows you to manage games and reset data
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Creating Session...' : 'Create Session'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="e.g., abc123def456"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter the session code shared by the game creator
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Joining Session...' : 'Join Session'}
          </button>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-gray-700">
        <p className="text-xs text-gray-400 text-center">
          Create a session to manage games, or join with a code to view results
        </p>
      </div>
    </div>
  );
};

export default SessionSetup;
