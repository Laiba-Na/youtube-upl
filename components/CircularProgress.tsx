import React from 'react';
import { useDarkMode } from '@/app/DarkModeContext';

interface CircularProgressProps {
  value: number;
  maxValue: number;
  label: string;
  bottomText: string;
  size?: number;
  thickness?: number;
  color?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  maxValue,
  label,
  bottomText,
  size = 160,
  thickness = 12,
  color = '#9C27B0', // Default to primaryPurple
}) => {
  const { darkMode } = useDarkMode();
  
  // Calculate the percentage filled
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  
  // Calculate circle properties
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Center position
  const center = size / 2;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* SVG with proper circular shadow */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          <defs>
            <filter id="circular-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="0" dy="2" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Background circle */}
          <g filter="url(#circular-shadow)">
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill={darkMode ? '#1F2937' : 'white'}
              stroke={darkMode ? '#4B5563' : '#f0f0f0'}
              strokeWidth={thickness}
            />
          </g>
          
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        
        {/* Content inside the circle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-textBlack'}`}>
            {value}
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {label}
          </div>
          <div className="flex space-x-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-primaryRed"></div>
            <div className="w-2 h-2 rounded-full bg-primaryPurple"></div>
            <div className="w-2 h-2 rounded-full bg-highlightYellow"></div>
          </div>
        </div>
      </div>
      
      {/* Bottom label with shadow */}
      <div
        className={`mt-4 px-6 py-2 rounded-full font-bold ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-textBlack'
        }`}
        style={{
          boxShadow: darkMode
            ? '0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
      >
        {bottomText}
      </div>
    </div>
  );
};

export default CircularProgress;