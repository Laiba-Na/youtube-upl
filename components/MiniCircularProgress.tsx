import React from 'react';
import { useDarkMode } from '@/app/DarkModeContext';

interface MiniCircularProgressProps {
  value: number;
  maxValue: number;
  platform: 'youtube' | 'facebook';
  isSelected: boolean;
  onClick: () => void;
}

const MiniCircularProgress: React.FC<MiniCircularProgressProps> = ({
  value,
  maxValue,
  platform,
  isSelected,
  onClick,
}) => {
  const { darkMode } = useDarkMode();
  const size = 80;
  const thickness = 8;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  const platformStyles = {
    youtube: {
      stroke: '#E63946',
      bg: 'bg-primaryRed',
    },
    facebook: {
      stroke: '#3B82F6',
      bg: 'bg-blue-500',
    },
  };

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
        isSelected ? platformStyles[platform].bg : 'bg-gray-200 dark:bg-gray-600'
      } ${isSelected ? 'scale-110' : 'hover:scale-105'} p-2`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill={darkMode ? '#1F2937' : 'white'}
          stroke={darkMode ? '#4B5563' : '#f0f0f0'}
          strokeWidth={thickness}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={platformStyles[platform].stroke}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-textBlack'}`}>
          {value.toLocaleString()}
        </span>
        <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {platform === 'youtube' ? 'Views' : 'Impressions'}
        </span>
      </div>
    </button>
  );
};

export default MiniCircularProgress;