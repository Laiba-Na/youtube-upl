'use client';

import { useDarkMode } from '@/app/DarkModeContext';
import { useState } from 'react';
import ShareButtons from '@/components/ShareButtons';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/sideBar';
import { Menu } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  description: string | null;
  hashtags: string | null;
  imageUrl: string | null;
}

interface PostMediaClientProps {
  post: Post;
  imageUrl: string;
  formattedHashtags: string;
}

export default function PostMediaClient({ post, imageUrl, formattedHashtags }: PostMediaClientProps) {
  const { darkMode } = useDarkMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <TopBar />
      <div className="flex">
        <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <button
          className={`lg:hidden fixed top-4 right-4 z-50 p-2 text-white bg-primaryPurple rounded-full hover:bg-highlightBlue transition-all duration-200 ${
            isSidebarOpen ? 'hidden' : 'block'
          }`}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-textBlack dark:text-white">{post.title}</h1>
            {post.imageUrl ? (
              <img
                src={imageUrl}
                alt={post.title}
                className="w-full h-auto mb-4 rounded-2xl object-cover shadow-md"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                }}
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-2xl mb-4 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                No Image
              </div>
            )}
            {post.description && (
              <p className="mb-4 text-gray-600 dark:text-gray-300">{post.description}</p>
            )}
            {formattedHashtags && (
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Hashtags: {formattedHashtags}</p>
            )}
            <ShareButtons
              imageUrl={imageUrl}
              title={post.title}
              description={post.description || ''}
              hashtags={formattedHashtags}
            />
          </div>
        </main>
      </div>
    </div>
  );
}