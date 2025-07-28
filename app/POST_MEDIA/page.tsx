'use client';

import { useRouter } from 'next/navigation';
import { useDarkMode } from '@/app/DarkModeContext';
import { useState } from 'react';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/sideBar';
import { Menu } from 'lucide-react';

export default function Page() {
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleRedirectToPosts = () => {
    router.push('/POST_CATALOG');
  };

  const handleRedirectToYouTubeUpload = () => {
    router.push('/youtube/upload');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-primaryPurple to-primaryRed'} transition-colors duration-300`}>
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
        <main className="flex-1 flex items-center justify-center p-6 lg:p-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-2 mb-6">
              <span className="w-3 h-3 rounded-full bg-primaryPurple"></span>
              <span className="w-3 h-3 rounded-full bg-textBlack dark:bg-white"></span>
              <span className="w-3 h-3 rounded-full bg-primaryRed"></span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-6">Welcome</h1>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleRedirectToPosts}
                className="px-6 py-2 border border-white rounded-full text-white hover:bg-white hover:text-primaryPurple dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-all duration-200"
                aria-label="View your posts"
              >
                View Your Posts
              </button>
              <button
                onClick={handleRedirectToYouTubeUpload}
                className="px-6 py-2 border border-white rounded-full text-white hover:bg-white hover:text-primaryPurple dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-all duration-200"
                aria-label="Upload to YouTube"
              >
                Upload to YouTube
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}