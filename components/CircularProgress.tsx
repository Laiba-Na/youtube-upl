// components/CircularProgress.tsx
import React from 'react';

interface CircularProgressProps {
  value: number;        // Value to display in the center (e.g., 244)
  maxValue: number;     // Maximum possible value (for calculating percentage)
  label: string;        // The label text (e.g., "Lorem ipsum")
  bottomText: string;   // The text at the bottom (e.g., "LOREM IPSUM")
  size?: number;        // Size of the circle in pixels
  thickness?: number;   // Thickness of the circle border
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  maxValue,
  label,
  bottomText,
  size = 160,
  thickness = 12,
}) => {
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
          {/* Better shadow filter */}
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
            
            {/* Gradient definition */}
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E83E5A" />
              <stop offset="50%" stopColor="#9C27B0" />
              <stop offset="100%" stopColor="#E83E5A" />
            </linearGradient>
          </defs>
          
          {/* Outer group with shadow */}
          <g filter="url(#circular-shadow)">
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="white"
              stroke="#f0f0f0"
              strokeWidth={thickness}
            />
          </g>
          
          {/* Progress circle - rendered separately to avoid shadow on the progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={thickness}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Content inside the circle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold">{value}</div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="flex space-x-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-primaryRed"></div>
            <div className="w-2 h-2 rounded-full bg-primaryPurple"></div>
            <div className="w-2 h-2 rounded-full bg-highlightOrange"></div>
          </div>
        </div>
      </div>
      
      {/* Bottom label with shadow */}
      <div className="mt-4 bg-white px-6 py-2 rounded-full font-bold" 
           style={{ 
             boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
             filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.15))'
           }}>
        {bottomText}
      </div>
    </div>
  );
};

export default CircularProgress;