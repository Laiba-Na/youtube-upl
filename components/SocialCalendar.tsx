import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import { SocialPost } from "@prisma/client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

// Setup the localizer for react-big-calendar
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Define the views we want to show
const allowedViews = [Views.MONTH, Views.WEEK, Views.DAY];

// Define ToolbarProps manually based on react-big-calendar's toolbar props
interface ToolbarProps {
  label: string;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY" | "DATE") => void;
  onView: (view: string) => void;
  view: string;
  date: Date;
  views: string[];
}

// Custom Toolbar Component with explicit typing
interface CustomToolbarProps extends ToolbarProps {
  onButtonClick: () => void;
}

const CustomToolbar = ({
  label,
  onNavigate,
  onView,
  view,
  onButtonClick,
}: CustomToolbarProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between items-center mb-6 gap-4">
      <div className="space-x-2">
        <button
          onClick={() => {
            onNavigate("TODAY");
            onButtonClick();
          }}
          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
        >
          Today
        </button>
        <button
          onClick={() => {
            onNavigate("PREV");
            onButtonClick();
          }}
          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
        >
          Back
        </button>
        <button
          onClick={() => {
            onNavigate("NEXT");
            onButtonClick();
          }}
          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
        >
          Next
        </button>
      </div>
      <h1 className="text-3xl font-extrabold text-black tracking-wide px-4 py-2 rounded-lg shadow-sm">
        {label}
      </h1>
      <div className="space-x-2">
        {allowedViews.map((viewOption) => (
          <button
            key={viewOption}
            onClick={() => {
              onView(viewOption);
              onButtonClick();
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
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
  onButtonClick: () => void;
}

export default function SocialCalendar({
  posts,
  onButtonClick,
}: CalendarProps) {
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const events = posts
    .filter((post) => post.scheduledAt)
    .map((post) => {
      console.log("Mapping post to event:", post);
      return {
        id: post.id,
        title: `${post.platform}: ${post.content.substring(0, 20)}...`,
        start: new Date(post.scheduledAt!),
        end: new Date(post.scheduledAt!),
        resource: post,
      };
    });

  const handleSelectEvent = (event: any) => {
    setSelectedPost(event.resource);
    setIsOpen(true);
  };

  // Custom Event Component for card-like display
  const EventCard = ({ event }: { event: any }) => {
    const post = event.resource as SocialPost;
    const platformIcons: { [key: string]: string } = {
      YOUTUBE: "🎥",
      INSTAGRAM: "📷",
      LINKEDIN: "💼",
      FACEBOOK: "📘",
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-3 m-2 border border-gray-100 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 min-w-[200px]">
        {/* Header Section: Platform Icon and Name */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl">
            {platformIcons[post.platform] || "📌"}
          </span>
          <span className="font-bold text-sm text-gray-800 truncate">
            {post.platform}
          </span>
        </div>

        {/* Image Section */}
        {post.mediaUrl ? (
          <img
            src={post.mediaUrl}
            alt={`${post.platform} post preview`}
            className="w-full h-24 object-cover rounded-lg mb-2"
            onError={(e) => {
              console.log("Image failed to load:", post.mediaUrl);
              e.currentTarget.src =
                "https://via.placeholder.com/150?text=Image+Not+Found"; // Fallback image
            }}
          />
        ) : (
          <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-gray-500 text-sm">
            No Image
          </div>
        )}

        {/* Content Preview */}
        <p className="text-xs text-gray-700 font-medium truncate">
          {post.content.substring(0, 30)}...
        </p>

        {/* Status Indicator */}
        <div className="mt-2 flex justify-end">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              post.status === "SCHEDULED"
                ? "bg-yellow-100 text-yellow-800"
                : post.status === "POSTED"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {post.status}
          </span>
        </div>
      </div>
    );
  };

  // Helper function to get platform icon
  const getPlatformIcon = (platform: string | undefined) => {
    switch (platform) {
      case "YOUTUBE":
        return "🎥";
      case "INSTAGRAM":
        return "📷";
      case "LINKEDIN":
        return "💼";
      case "FACEBOOK":
        return "📘";
      default:
        return "📌";
    }
  };

  return (
    <div className="p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={allowedViews}
        components={{
          toolbar: (props: ToolbarProps) => (
            <CustomToolbar {...props} onButtonClick={onButtonClick} />
          ),
          event: EventCard,
        }}
        style={{ height: 600 }}
        onSelectEvent={handleSelectEvent}
        className="bg-white rounded-lg shadow"
      />

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-100" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold text-gray-900 flex items-center space-x-2"
                  >
                    <span>{getPlatformIcon(selectedPost?.platform)}</span>
                    <span>{selectedPost?.platform || "Post"} Post</span>
                  </Dialog.Title>
                  <div className="mt-4">
                    <p className="text-base text-gray-700 whitespace-pre-wrap">
                      {selectedPost?.content || "No content available"}
                    </p>
                    {selectedPost?.mediaUrl && (
                      <img
                        src={selectedPost.mediaUrl}
                        alt={`${selectedPost.platform} post media`}
                        className="mt-4 w-full h-auto rounded-md"
                        onError={(e) =>
                          console.log(
                            "Image failed to load in modal:",
                            selectedPost.mediaUrl
                          )
                        }
                      />
                    )}
                    <p className="text-sm text-gray-500 mt-4">
                      <strong>Status:</strong> {selectedPost?.status || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">
                      <strong>Scheduled:</strong>{" "}
                      {selectedPost?.scheduledAt?.toLocaleString() || "N/A"}
                    </p>
                  </div>
                  <div className="mt-6 flex space-x-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition duration-300"
                      onClick={() => setIsOpen(false)}
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