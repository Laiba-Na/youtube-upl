'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useDarkMode } from '@/app/DarkModeContext';
import ProfileSettings from '@/components/settings/ProfileSettings';
import ConnectedAccounts from '@/components/settings/ConnectedAccounts';
import NotificationSettings from '@/components/settings/NotificationSettings';
import TeamSettings from '@/components/settings/TeamSettings';
import DangerZone from '@/components/settings/DangerZone';
import ContactUs from '@/components/settings/ContactUs'; // Add this import
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/sideBar';
import { Menu } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const tabs = [
  { name: 'Profile', icon: '👤' },
  { name: 'Connected Accounts', icon: '🔗' },
  { name: 'Notifications', icon: '🔔' },
  { name: 'Team', icon: '👥' },
  { name: 'Contact Us', icon: '✉️' }, // Add this new tab
  { name: 'Danger Zone', icon: '⚠️' },
  { name: 'Sign Out', icon: '🚪' },
];

export default function SettingsPage() {
  const { darkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState('Profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <Toaster position="top-right" />
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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-textBlack dark:text-white mb-6">
              Settings
            </h1>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Settings Sidebar */}
              <aside className="w-full lg:w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <ul className="space-y-2">
                  {tabs.map((tab) => (
                    <li key={tab.name}>
                      <button
                        onClick={() => {
                          if (tab.name === 'Sign Out') {
                            handleSignOut();
                          } else {
                            setActiveTab(tab.name);
                          }
                        }}
                        className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg text-left transition-all duration-200 ${
                          activeTab === tab.name
                            ? 'bg-primaryPurple text-white'
                            : 'text-textBlack dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        aria-label={`Switch to ${tab.name} settings`}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>
              {/* Content */}
              <div className="flex-1">
                {activeTab === 'Profile' && <ProfileSettings />}
                {activeTab === 'Connected Accounts' && <ConnectedAccounts />}
                {activeTab === 'Notifications' && <NotificationSettings />}
                {activeTab === 'Team' && <TeamSettings />}
                {activeTab === 'Contact Us' && <ContactUs />} {/* Add this line */}
                {activeTab === 'Danger Zone' && <DangerZone />}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}