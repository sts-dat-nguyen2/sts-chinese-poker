
import React from 'react';
import { View } from '../types';
import { TrophyIcon, ListBulletIcon, ChartBarIcon, PlusIcon, ArrowPathIcon, PlayIcon } from '@heroicons/react/24/solid';

interface HeaderProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onReset: () => void;
  onNewGame: () => void;
  isGameInProgress: boolean;
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


const Header: React.FC<HeaderProps> = ({ activeView, onNavigate, onReset, onNewGame, isGameInProgress }) => {
  return (
    <header className="bg-gray-800 p-4 rounded-xl shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <TrophyIcon className="h-8 w-8 text-yellow-400"/>
          <h1 className="text-2xl font-bold text-white tracking-wider">Game Night Ledger</h1>
        </div>
        
        <nav className="flex items-center justify-center bg-gray-900 p-2 rounded-lg shadow-inner space-x-2">
          <NavButton 
            isActive={activeView === View.SETUP || activeView === View.FINALIZE}
            onClick={onNewGame}
            icon={isGameInProgress ? <PlayIcon className="h-5 w-5"/> : <PlusIcon className="h-5 w-5"/>}
            text={isGameInProgress ? 'Current Game' : 'New Game'}
          />
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
        
        <button
          onClick={onReset}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-red-600/20 text-red-400 hover:bg-red-600/40 hover:text-red-300"
        >
          <ArrowPathIcon className="h-5 w-5" />
          <span className="hidden md:inline">Reset Data</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
