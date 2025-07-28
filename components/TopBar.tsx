import React, { useState } from 'react';
import { useDarkMode } from '@/app/DarkModeContext';
import { Menu, X } from 'lucide-react';

const TopBar: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className={`w-full h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300 ${darkMode ? 'bg-gray-900' : 'bg-textBlack'}`}>
      {/* Logo */}
      <div className="flex items-center ">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 scale-150"
        >
          <g clipPath="url(#clip0)">
            {/* Speech bubble shape */}
            <path
              d="M32 16C25.73 16 20 21.73 20 28C20 32.89 22.61 36.93 26.4 39.63L25.28 44.88C25.06 45.68 25.47 46.4 26.18 46.08L30.62 43.78C31.34 43.94 32.07 44 32 44C38.27 44 44 38.27 44 28C44 21.73 38.27 16 32 16Z"
              fill={darkMode ? '#FBBF24' : '#9C27B0'} // highlightYellow in dark mode, primaryPurple in light mode
            />
            {/* Interconnected nodes */}
            <circle cx="26" cy="26" r="3" fill={darkMode ? '#E63946' : '#3B82F6'} /> {/* primaryRed or highlightBlue */}
            <circle cx="38" cy="26" r="3" fill={darkMode ? '#E63946' : '#3B82F6'} />
            <circle cx="32" cy="34" r="3" fill={darkMode ? '#E63946' : '#3B82F6'} />
            <path
              d="M26 26L32 34M38 26L32 34"
              stroke={darkMode ? '#E63946' : '#3B82F6'}
              strokeWidth="2"
            />
          </g>
          <defs>
            <clipPath id="clip0">
              <rect width="64" height="64" fill="white" />
            </clipPath>
          </defs>
        </svg>
        <span className=" text-xl font-bold text-white">Social Media Manager</span>
      </div>

      
      {/* Desktop Navigation and Dark Mode Toggle */}
      <div className="hidden lg:flex items-center space-x-6">
        <a href="/DASHBOARD" className="text-white hover:text-highlightBlue transition-colors duration-200">
          Dashboard
        </a>
        <a href="/SETTINGS" className="text-white hover:text-highlightBlue transition-colors duration-200">
          Settings
        </a>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-700 dark:bg-gray-600 text-white hover:bg-highlightBlue transition-all duration-200"
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

    </div>
  );
};

export default TopBar;