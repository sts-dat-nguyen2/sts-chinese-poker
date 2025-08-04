import React, { useState } from 'react';
import { View } from '../types';
import { TrophyIcon, ListBulletIcon, ChartBarIcon, PlusIcon, ArrowPathIcon, PlayIcon, ArrowLeftOnRectangleIcon, ShareIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/solid';

interface HeaderProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onReset: () => void;
  onNewGame: () => void;
  isGameInProgress: boolean;
  isCreator: boolean;
  sessionName?: string;
  sessionCode?: string | null;
  onLogout: () => void;
}

const NavButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  text: string;
}> = ({ isActive, onClick, icon, text }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-3 py-2 text-sm md:text-base font-medium rounded-md transition-colors duration-200 ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {icon}
    <span className="hidden md:inline">{text}</span>
  </button>
);


const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  onReset,
  onNewGame,
  isGameInProgress,
  isCreator,
  sessionName,
  sessionCode,
  onLogout
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    if (!sessionCode) return;

    const shareUrl = `${window.location.origin}/session/${sessionCode}`;

    // Use modern Clipboard API if available and in a secure context
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        return;
      } catch (err) {
        console.error('Failed to copy with Clipboard API:', err);
        // Fallback to legacy method if modern one fails
      }
    }

    // Legacy fallback for insecure contexts (like HTTP) or older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      
      // Styling to make it invisible
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      if (successful) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        throw new Error('Copy command was not successful.');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      alert('Failed to copy link. Please copy it manually.');
    } finally {
      const textAreas = document.getElementsByTagName('textarea');
      if (textAreas.length > 0) {
        document.body.removeChild(textAreas[0]);
      }
    }
  };

  return (
    <header className="bg-gray-800 p-4 rounded-xl shadow-lg">
      <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
        <div className="flex flex-col items-center lg:items-start">
          <div className="flex items-center space-x-2">
            <TrophyIcon className="h-8 w-8 text-yellow-400"/>
            <h1 className="text-2xl font-bold text-white tracking-wider">Game Night Ledger</h1>
          </div>
          {sessionName && (
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-gray-300">Session:</span>
              <span className="text-sm font-medium text-blue-400">{sessionName}</span>
              {isCreator && (
                <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">Creator</span>
              )}
              <button
                onClick={handleShare}
                className="flex items-center space-x-1 text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600/30 transition-colors"
                title="Copy session link"
              >
                {isCopied ? (
                  <>
                    <ClipboardDocumentCheckIcon className="h-4 w-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <ShareIcon className="h-4 w-4" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <nav className="flex items-center justify-center bg-gray-900 p-2 rounded-lg shadow-inner space-x-2">
          {isCreator && (
            <NavButton
              isActive={activeView === View.GAME_SETUP || activeView === View.FINALIZE}
              onClick={onNewGame}
              icon={isGameInProgress ? <PlayIcon className="h-5 w-5"/> : <PlusIcon className="h-5 w-5"/>}
              text={isGameInProgress ? 'Current Game' : 'New Game'}
            />
          )}
          <NavButton
            isActive={activeView === View.HISTORY}
            onClick={() => onNavigate(View.HISTORY)}
            icon={<ListBulletIcon className="h-5 w-5"/>}
            text="History"
          />
          <NavButton
            isActive={activeView === View.LEDGER}
            onClick={() => onNavigate(View.LEDGER)}
            icon={<ChartBarIcon className="h-5 w-5"/>}
            text="Ledger"
          />
        </nav>

        <div className="flex items-center space-x-2">
          {isCreator && (
            <button
              onClick={onReset}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-red-600/20 text-red-400 hover:bg-red-600/40 hover:text-red-300"
            >
              <ArrowPathIcon className="h-5 w-5" />
              <span className="hidden md:inline">Reset Data</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-gray-600/20 text-gray-400 hover:bg-gray-600/40 hover:text-gray-300"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
