'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useDarkMode } from '@/app/DarkModeContext';
import { FaYoutube, FaFacebook, FaTumblr, FaPinterest, FaTwitter } from 'react-icons/fa';
import { Menu } from 'lucide-react';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/sideBar';

export default function Analytics() {
  const { darkMode } = useDarkMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <TopBar />
      <div className="flex">
        <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <button
          className={`lg:hidden fixed top-4 right-4 z-50 p-2 text-white bg-primaryPurple rounded-full hover:bg-highlightBlue transition-all duration-200 ${isSidebarOpen ? 'hidden' : 'block'}`}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <main className="flex-1 p-6 lg:p-8 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-8 text-textBlack dark:text-white">Analytics</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
            {/* YouTube */}
            <Link
              href="/youtube/Analytics"
              className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 w-full h-64"
              aria-label="View YouTube Analytics"
            >
              <FaYoutube className="text-primaryRed text-6xl mb-4" />
              <span className="text-lg font-semibold text-textBlack dark:text-white">YouTube</span>
            </Link>

            {/* Facebook */}
            <Link
              href="/facebook/analytics"
              className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 w-full h-64"
              aria-label="View Facebook Analytics"
            >
              <FaFacebook className="text-highlightBlue text-6xl mb-4" />
              <span className="text-lg font-semibold text-textBlack dark:text-white">Facebook</span>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}