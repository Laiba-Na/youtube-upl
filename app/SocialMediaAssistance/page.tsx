"use client";

import { useState } from "react";
import SocialAssistant from '@/components/SocialAssistant';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/sideBar';
import { Menu } from 'lucide-react';
import { useDarkMode } from '@/app/DarkModeContext';

export default function Home() {
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
        <main className="flex-1 p-6 lg:pl-8 lg:pt-8">
          <div className="max-w-4xl mx-auto ">
            <h1 className="text-3xl font-bold  text-textBlack dark:text-white mb-6 text-center">
              Social Media Assistant
            </h1>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <SocialAssistant />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}