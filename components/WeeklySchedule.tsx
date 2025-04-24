// components/WeeklySchedule.tsx
import React, { useState, useEffect } from 'react';
import { FaFacebook, FaYoutube, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { format, addDays } from 'date-fns';

// Types
interface ScheduleDay {
  date: Date;
  title: string;
  summary: string;
}

interface PlatformSchedule {
  id: 'facebook' | 'youtube' | 'instagram' | 'linkedin';
  name: string;
  icon: React.ReactNode;
  hasNotification: boolean;
  days: ScheduleDay[];
}

const WeeklySchedule: React.FC = () => {
  // Generate a week's worth of placeholder data starting from today
  const generateWeekSchedule = (): ScheduleDay[] => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i);
      return {
        date,
        title: `Event for ${format(date, 'EEE dd MMM')}`,
        summary: `Lorem ipsum hikni walium Lorem ipsum hikni walium`
      };
    });
  };

  // Initialize platforms with default data
  const [platforms, setPlatforms] = useState<PlatformSchedule[]>([
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <FaFacebook />,
      hasNotification: true,
      days: generateWeekSchedule()
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: <FaYoutube />,
      hasNotification: false,
      days: generateWeekSchedule()
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: <FaInstagram />,
      hasNotification: true,
      days: generateWeekSchedule()
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: <FaLinkedin />,
      hasNotification: false,
      days: generateWeekSchedule()
    }
  ]);

  const [activePlatform, setActivePlatform] = useState<PlatformSchedule>(platforms[0]);
  const [visibleDayIndex, setVisibleDayIndex] = useState(0);

  // Get currently visible days
  const visibleDays = activePlatform.days.slice(visibleDayIndex, visibleDayIndex + 3);

  // Handle navigation
  const handleScrollUp = () => {
    if (visibleDayIndex > 0) {
      setVisibleDayIndex(visibleDayIndex - 1);
    }
  };

  const handleScrollDown = () => {
    if (visibleDayIndex < activePlatform.days.length - 3) {
      setVisibleDayIndex(visibleDayIndex + 1);
    }
  };

  // Select platform
  const handlePlatformSelect = (platform: PlatformSchedule) => {
    setActivePlatform(platform);
    setVisibleDayIndex(0);
  };

  // Update title and summary
  const updateDayContent = (dayIndex: number, title: string, summary: string) => {
    const updatedPlatforms = [...platforms];
    const platformIndex = updatedPlatforms.findIndex(p => p.id === activePlatform.id);
    updatedPlatforms[platformIndex].days[dayIndex].title = title;
    updatedPlatforms[platformIndex].days[dayIndex].summary = summary;
    setPlatforms(updatedPlatforms);
    setActivePlatform(updatedPlatforms[platformIndex]);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-lg overflow-hidden p-4">
      <div className="relative">
        {/* Days Display */}
        <div className="space-y-4 mb-6">
          {visibleDays.map((day, index) => (
            <div 
              key={index} 
              className={`flex items-center rounded-full overflow-hidden transition-all duration-300 ${
                index === 2 ? 'opacity-50' : 'opacity-100'
              } ${
                index === 0 ? 'bg-red-400' : 
                index === 1 ? 'bg-white border border-purple-500' : 
                'bg-orange-300'
              }`}
            >
              <div className={`flex-shrink-0 h-16 w-16 rounded-full flex flex-col items-center justify-center ${
                index === 0 ? 'bg-teal-800 text-white' : 
                index === 1 ? 'bg-teal-800 text-white' : 
                'bg-gray-300 text-gray-700'
              }`}>
                <span className="font-bold uppercase">
                  {format(day.date, 'EEE')}
                </span>
                <span className="text-sm">
                  {format(day.date, 'dd MMM')}
                </span>
              </div>
              <div className="flex-1 px-4">
                <h3 className="font-bold text-teal-900 uppercase">{day.title}</h3>
                <p className="text-sm text-gray-700">{day.summary}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <div className="absolute right-0 inset-y-0 flex flex-col items-center justify-center">
          <button 
            onClick={handleScrollUp}
            disabled={visibleDayIndex === 0}
            className={`p-2 text-gray-500 focus:outline-none ${visibleDayIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-gray-700'}`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button 
            onClick={handleScrollDown}
            disabled={visibleDayIndex >= activePlatform.days.length - 3}
            className={`p-2 text-gray-500 focus:outline-none ${visibleDayIndex >= activePlatform.days.length - 3 ? 'opacity-30 cursor-not-allowed' : 'hover:text-gray-700'}`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Platform Selection */}
      <div className="flex justify-center mt-4 space-x-6">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => handlePlatformSelect(platform)}
            className={`relative p-3 rounded-full text-lg ${
              activePlatform.id === platform.id 
                ? 'bg-red-500 text-white' 
                : platform.id === 'facebook' 
                  ? 'bg-blue-500 text-white'
                  : platform.id === 'youtube'
                    ? 'bg-red-600 text-white'
                    : platform.id === 'instagram'
                      ? 'bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 text-white'
                      : 'bg-blue-700 text-white'
            }`}
          >
            {platform.hasNotification && (
              <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full"></span>
            )}
            {platform.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WeeklySchedule;