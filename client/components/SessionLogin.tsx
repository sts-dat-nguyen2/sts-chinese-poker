// components/SessionLogin.tsx
import React, { useState } from 'react';
import { Session, LoginData } from '../types';

interface SessionLoginProps {
  session: Session;
  onLogin: (loginData: LoginData) => void;
  onViewAsGuest: () => void;
  isLoading?: boolean;
  error?: string;
}

const SessionLogin: React.FC<SessionLoginProps> = ({
  session,
  onLogin,
  onViewAsGuest,
  isLoading = false,
  error
}) => {
  const [loginData, setLoginData] = useState<LoginData>({
    creatorName: '',
    creatorPassword: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.creatorName.trim() && loginData.creatorPassword.trim()) {
      onLogin(loginData);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-gray-800 rounded-2xl shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">🏆 {session.session_name}</h1>
        <p className="text-gray-300">Created by {session.creator_name}</p>
        <p className="text-xs text-gray-400 mt-1">
          Session: {session.session_code}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Creator Login */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Creator Access</h3>
          <p className="text-sm text-gray-300 mb-4">
            Login as the creator to manage games and update scores
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Creator Name
              </label>
              <input
                type="text"
                value={loginData.creatorName}
                onChange={(e) => setLoginData(prev => ({ ...prev, creatorName: e.target.value }))}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Creator Password
              </label>
              <input
                type="password"
                value={loginData.creatorPassword}
                onChange={(e) => setLoginData(prev => ({ ...prev, creatorPassword: e.target.value }))}
                placeholder="Your password"
                className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'Logging in...' : 'Login as Creator'}
            </button>
          </form>
        </div>

        {/* Guest View */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Guest View</h3>
          <p className="text-sm text-gray-300 mb-4">
            View game history and current standings (read-only)
          </p>

          <button
            onClick={onViewAsGuest}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            View as Guest
          </button>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-700">
        <h4 className="text-sm font-medium text-white mb-3 text-center">📤 Share with Friends</h4>
        <div className="bg-gray-600 rounded-lg p-4">
          <p className="text-xs text-gray-300 mb-2 text-center">Send this URL to let others view the game results:</p>
          <div className="bg-gray-900 rounded-md p-3 mb-3">
            <code className="text-blue-400 text-sm break-all">
              {window.location.origin}/session/{session.session_code}
            </code>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/session/${session.session_code}`)}
            className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm py-2 px-3 rounded-md transition-colors"
          >
            📋 Copy Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionLogin;
