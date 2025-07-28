'use client';

import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState } from 'react';
import { SocialPost } from '@prisma/client';
import { Dialog, Transition } from '@headlessui/react';
import { useDarkMode } from '@/app/DarkModeContext';

// Setup the localizer for react-big-calendar
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Define the views we want to show
const allowedViews = [Views.MONTH, Views.WEEK, Views.DAY];

// Define event type for calendar
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: SocialPost;
}

// Define ToolbarProps
interface ToolbarProps {
  label: string;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', date?: Date) => void;
  onView: (view: string) => void;
  view: string;
  date: Date;
  views: string[];
}

// Custom Toolbar Component
interface CustomToolbarProps extends ToolbarProps {}

const CustomToolbar = ({ label, onNavigate, onView, view }: CustomToolbarProps) => {
  const { darkMode } = useDarkMode();
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between items-center mb-6 gap-4">
      <div className="space-x-2">
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue transition-all duration-200"
          aria-label="Go to today"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate('PREV')}
          className="px-3 py-1 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue transition-all duration-200"
          aria-label="Previous"
        >
          Back
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="px-3 py-1 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue transition-all duration-200"
          aria-label="Next"
        >
          Next
        </button>
      </div>
      <h1 className="text-2xl font-bold text-textBlack dark:text-white px-4 py-2 rounded-lg shadow-sm">
        {label}
      </h1>
      <div className="space-x-2">
        {allowedViews.map((viewOption) => (
          <button
            key={viewOption}
            onClick={() => onView(viewOption)}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              view === viewOption
                ? 'bg-primaryPurple text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-textBlack dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600'
            }`}
            aria-label={`View ${viewOption}`}
          >
            {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

interface CalendarProps {
  posts: SocialPost[];
}

export default function SocialCalendar({ posts }: CalendarProps) {
  const { darkMode } = useDarkMode();
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const events: CalendarEvent[] = posts
    .filter((post): post is SocialPost & { scheduledAt: Date } => !!post.scheduledAt)
    .map((post) => ({
      id: post.id,
      title: `${post.platform}: ${post.content.substring(0, 20)}...`,
      start: new Date(post.scheduledAt),
      end: new Date(post.scheduledAt),
      resource: post,
    }));

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedPost(event.resource);
    setIsOpen(true);
  };

  // Custom Event Component
  const EventCard = ({ event }: { event: CalendarEvent }) => {
    const post = event.resource;
    const platformIcons: Record<string, string> = {
      YOUTUBE: '🎥',
      INSTAGRAM: '📷',
      LINKEDIN: '💼',
      FACEBOOK: '📘',
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-3 m-2 border border-gray-100 dark:border-gray-600 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 min-w-[200px]">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl">{platformIcons[post.platform] || '📌'}</span>
          <span className="font-bold text-sm text-textBlack dark:text-white truncate">
            {post.platform}
          </span>
        </div>
        {post.mediaUrl ? (
          <img
            src={post.mediaUrl}
            alt={`${post.platform} post preview`}
            className="w-full h-24 object-cover rounded-lg mb-2"
            onError={(e) => {
              console.log('Image failed to load:', post.mediaUrl);
              e.currentTarget.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
            }}
          />
        ) : (
          <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
            No Image
          </div>
        )}
        <p className="text-xs text-textBlack dark:text-gray-200 font-medium truncate">
          {post.content.substring(0, 30)}...
        </p>
        <div className="mt-2 flex justify-end">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              post.status === 'SCHEDULED'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : post.status === 'POSTED'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {post.status}
          </span>
        </div>
      </div>
    );
  };

  const getPlatformIcon = (platform: string | undefined) => {
    switch (platform) {
      case 'YOUTUBE':
        return '🎥';
      case 'INSTAGRAM':
        return '📷';
      case 'LINKEDIN':
        return '💼';
      case 'FACEBOOK':
        return '📘';
      default:
        return '📌';
    }
  };

  return (
    <div className="p-4">
      <style jsx global>{`
        .rbc-calendar {
          background-color: ${darkMode ? '#1F2A44' : '#FFFFFF'};
          color: ${darkMode ? '#F3F4F6' : '#1F2A44'};
        }
        .rbc-month-view,
        .rbc-time-view {
          background-color: ${darkMode ? '#1F2A44' : '#FFFFFF'};
          border-color: ${darkMode ? '#4B5563' : '#E5E7EB'};
        }
        .rbc-header,
        .rbc-day-bg,
        .rbc-time-slot {
          background-color: ${darkMode ? '#1F2A44' : '#FFFFFF'};
          color: ${darkMode ? '#F3F4F6' : '#1F2A44'};
          border-color: ${darkMode ? '#4B5563' : '#E5E7EB'};
        }
        .rbc-event {
          background-color: transparent !important;
          border: none !important;
        }
        .rbc-selected {
          background-color: ${darkMode ? '#3B82F6' : '#9C27B0'} !important;
        }
        .rbc-today {
          background-color: ${darkMode ? '#374151' : '#F3F4F6'};
        }
      `}</style>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={allowedViews}
        components={{
          //@ts-ignore
          toolbar: CustomToolbar,
          event: EventCard,
        }}
        style={{ height: 600 }}
        onSelectEvent={handleSelectEvent}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl"
      />
      <Transition show={isOpen}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold text-textBlack dark:text-white flex items-center space-x-2"
                  >
                    <span>{getPlatformIcon(selectedPost?.platform)}</span>
                    <span>{selectedPost?.platform || 'Post'} Post</span>
                  </Dialog.Title>
                  <div className="mt-4">
                    <p className="text-base text-textBlack dark:text-gray-200 whitespace-pre-wrap">
                      {selectedPost?.content || 'No content available'}
                    </p>
                    {selectedPost?.mediaUrl && (
                      <img
                        src={selectedPost.mediaUrl}
                        alt={`${selectedPost.platform} post media`}
                        className="mt-4 w-full h-auto rounded-md"
                        onError={(e) => {
                          console.log('Image failed to load in modal:', selectedPost.mediaUrl);
                          e.currentTarget.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                        }}
                      />
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                      <strong>Status:</strong> {selectedPost?.status || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <strong>Scheduled:</strong>{' '}
                      {selectedPost?.scheduledAt?.toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      }) || 'N/A'}
                    </p>
                  </div>
                  <div className="mt-6 flex space-x-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg bg-primaryPurple px-4 py-2 text-sm font-medium text-white hover:bg-highlightBlue transition-all duration-200"
                      onClick={() => setIsOpen(false)}
                      aria-label="Close dialog"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}