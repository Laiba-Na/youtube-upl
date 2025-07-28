import React, { useState, useEffect } from 'react';
import { FaFacebook, FaYoutube, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { format, addDays, isSameDay } from 'date-fns';
import { useSession } from 'next-auth/react';
import { SocialPost } from '@prisma/client';
import { useDarkMode } from '@/app/DarkModeContext';

// Types
interface ScheduleDay {
  date: Date;
  title: string;
  content: string;
  platform: string;
  id?: string; // Add post ID for updates
}

interface PlatformSchedule {
  id: 'facebook' | 'youtube' | 'instagram' | 'linkedin';
  name: string;
  icon: React.ReactNode;
  hasNotification: boolean;
  days: ScheduleDay[];
}

interface WeeklyScheduleProps {
  posts: SocialPost[];
}

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ posts }) => {
  const { darkMode } = useDarkMode();
  const { data: session } = useSession();

  // Generate a week's worth of days
  const generateWeekDays = (): Date[] => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  };

  // Map posts to platforms
  const mapPostsToPlatforms = (): PlatformSchedule[] => {
    const weekDays = generateWeekDays();
    const platforms: PlatformSchedule[] = [
      {
        id: 'facebook',
        name: 'Facebook',
        icon: <FaFacebook />,
        hasNotification: false,
        days: [],
      },
      {
        id: 'youtube',
        name: 'YouTube',
        icon: <FaYoutube />,
        hasNotification: false,
        days: [],
      },
      {
        id: 'instagram',
        name: 'Instagram',
        icon: <FaInstagram />,
        hasNotification: false,
        days: [],
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: <FaLinkedin />,
        hasNotification: false,
        days: [],
      },
    ];

    platforms.forEach((platform) => {
      platform.days = weekDays.map((date) => {
        const matchingPosts = posts.filter(
          (post) =>
            post.platform.toLowerCase() === platform.id &&
            isSameDay(new Date(post.scheduledAt), date)
        );
        const hasNotification = matchingPosts.length > 0;
        platform.hasNotification = platform.hasNotification || hasNotification;
        return {
          date,
          title: matchingPosts[0]?.content
            ? `${matchingPosts[0].content.substring(0, 30)}${matchingPosts[0].content.length > 30 ? '...' : ''}`
            : `No post for ${format(date, 'EEE dd MMM')}`,
          content: matchingPosts[0]?.content || 'No content scheduled',
          platform: platform.id,
          id: matchingPosts[0]?.id,
        };
      });
    });

    return platforms;
  };

  const [platforms, setPlatforms] = useState<PlatformSchedule[]>(mapPostsToPlatforms());
  const [activePlatform, setActivePlatform] = useState<PlatformSchedule>(platforms[0]);
  const [visibleDayIndex, setVisibleDayIndex] = useState(0);
  const [editingDay, setEditingDay] = useState<{ dayIndex: number; title: string; content: string } | null>(null);

  // Update platforms when posts change
  useEffect(() => {
    const updatedPlatforms = mapPostsToPlatforms();
    setPlatforms(updatedPlatforms);
    setActivePlatform(updatedPlatforms.find((p) => p.id === activePlatform.id) || updatedPlatforms[0]);
  }, [posts]);

  const visibleDays = activePlatform.days.slice(visibleDayIndex, visibleDayIndex + 3);

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

  const handlePlatformSelect = (platform: PlatformSchedule) => {
    setActivePlatform(platform);
    setVisibleDayIndex(0);
  };

  const handleEditDay = (dayIndex: number, day: ScheduleDay) => {
    setEditingDay({ dayIndex, title: day.title, content: day.content });
  };

  const handleSaveEdit = async (dayIndex: number) => {
    if (!editingDay || !session?.user?.id) return;

    const updatedPlatforms = [...platforms];
    const platformIndex = updatedPlatforms.findIndex((p) => p.id === activePlatform.id);
    const day = updatedPlatforms[platformIndex].days[dayIndex];

    // Update locally
    updatedPlatforms[platformIndex].days[dayIndex] = {
      ...day,
      title: editingDay.title,
      content: editingDay.content,
    };

    // Update on server if post exists
    if (day.id) {
      try {
        const response = await fetch(`/api/posts/${day.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editingDay.title,
            content: editingDay.content,
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to update post');
        }
      } catch (error) {
        console.error('Error updating post:', error);
        return;
      }
    }

    setPlatforms(updatedPlatforms);
    setActivePlatform(updatedPlatforms[platformIndex]);
    setEditingDay(null);
  };

  return (
    <div className={`w-full max-w-md mx-auto rounded-2xl shadow-xl p-6 transition-all duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="relative">
        {/* Days Display */}
        <div className="space-y-4 mb-6">
          {visibleDays.map((day, index) => (
            <div
              key={index}
              className={`flex items-center rounded-lg overflow-hidden transition-all duration-300 ${
                index === 2 ? 'opacity-50' : 'opacity-100'
              } ${index === 0 ? 'bg-primaryRed/20' : index === 1 ? 'bg-white dark:bg-gray-700 border border-primaryPurple' : 'bg-highlightYellow/20'}`}
            >
              <div
                className={`flex-shrink-0 h-16 w-16 rounded-lg flex flex-col items-center justify-center ${
                  index === 0 ? 'bg-primaryPurple text-white' : index === 1 ? 'bg-primaryPurple text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                }`}
              >
                <span className="font-bold uppercase">{format(day.date, 'EEE')}</span>
                <span className="text-sm">{format(day.date, 'dd MMM')}</span>
              </div>
              <div className="flex-1 px-4 py-2">
                {editingDay?.dayIndex === index + visibleDayIndex ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingDay.title}
                      onChange={(e) => setEditingDay({ ...editingDay, title: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-textBlack dark:text-white"
                    />
                    <textarea
                      value={editingDay.content}
                      onChange={(e) => setEditingDay({ ...editingDay, content: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-textBlack dark:text-white"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveEdit(index + visibleDayIndex)}
                        className="px-3 py-1 bg-highlightBlue text-white rounded-lg hover:bg-primaryPurple transition-all duration-200"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingDay(null)}
                        className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3
                      className={`font-bold uppercase ${darkMode ? 'text-white' : 'text-textBlack'} cursor-pointer hover:text-highlightBlue`}
                      onClick={() => handleEditDay(index + visibleDayIndex, day)}
                    >
                      {day.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{day.content}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <div className="absolute right-0 inset-y-0 flex flex-col items-center justify-center">
          <button
            onClick={handleScrollUp}
            disabled={visibleDayIndex === 0}
            className={`p-2 text-gray-500 dark:text-gray-400 focus:outline-none ${
              visibleDayIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-highlightBlue dark:hover:text-highlightBlue'
            }`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={handleScrollDown}
            disabled={visibleDayIndex >= activePlatform.days.length - 3}
            className={`p-2 text-gray-500 dark:text-gray-400 focus:outline-none ${
              visibleDayIndex >= activePlatform.days.length - 3 ? 'opacity-30 cursor-not-allowed' : 'hover:text-highlightBlue dark:hover:text-highlightBlue'
            }`}
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
            className={`relative p-3 rounded-full text-lg transition-all duration-300 ${
              activePlatform.id === platform.id
                ? 'bg-primaryPurple text-white'
                : platform.id === 'facebook'
                ? 'bg-blue-500 text-white'
                : platform.id === 'youtube'
                ? 'bg-primaryRed text-white'
                : platform.id === 'instagram'
                ? 'bg-gradient-to-tr from-primaryPurple via-pink-500 to-highlightYellow text-white'
                : 'bg-blue-700 text-white'
            } hover:bg-highlightBlue dark:hover:bg-highlightBlue`}
          >
            {platform.hasNotification && (
              <span className="absolute top-0 right-0 h-3 w-3 bg-highlightYellow rounded-full"></span>
            )}
            {platform.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WeeklySchedule;