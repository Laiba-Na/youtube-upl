import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { useDarkMode } from '@/app/DarkModeContext';
import { canAccess } from '../utils/permissions';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type NavItem = {
  name: string;
  path: string;
  resource: string;
};

const navItems: NavItem[] = [
  { name: 'DASHBOARD', path: '/DASHBOARD', resource: 'DASHBOARD' },
  { name: 'POST CATALOG', path: '/POST_CATALOG', resource: 'POST_CATALOG' },
  { name: 'CREATE POST', path: '/POST_EDITING', resource: 'POST_EDITING' },
  { name: 'ANALYTICS', path: '/ANALYTICS', resource: 'ANALYTICS' },
  { name: 'CALENDAR', path: '/CALENDAR', resource: 'CALENDAR' },
  { name: 'POST MEDIA', path: '/POST_MEDIA', resource: 'POST_MEDIA' },
  { name: 'TEAM SETUP', path: '/SETTINGS/TEAM_SETUP', resource: 'TEAM_SETUP' },
  { name: 'SETTINGS', path: '/SETTINGS', resource: 'SETTINGS' },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onClose }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [isCollapsed, setIsCollapsed] = useState(false); // Collapsed state only for desktop

  const userRole = session?.user?.role || Role.MEMBER;

  return (
    <>
      {/* Overlay for mobile view */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:sticky top-0 left-0 h-screen overflow-y-auto transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCollapsed && !isMobileOpen ? 'w-16' : 'w-64 lg:w-64'}
          bg-gradient-to-b from-primaryRed via-pink-600 to-primaryPurple p-4
          flex flex-col
          ${darkMode ? 'dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-800 dark:to-gray-700' : ''}
          z-40 lg:z-30
        `}
      >
        {/* Collapse/Close Button */}
        <div className="flex justify-between items-center mb-4 pt-16 lg:pt-0">
          {!isCollapsed && !isMobileOpen && (
            <span className="text-white font-bold text-lg hidden lg:block">
              Menu
            </span>
          )}
          <button
            onClick={isMobileOpen ? onClose : () => setIsCollapsed(!isCollapsed)}
            className="p-2 text-white bg-primaryPurple hover:bg-highlightBlue rounded-full transition-all duration-200 z-50"
            aria-label={isMobileOpen ? 'Close sidebar' : isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isMobileOpen ? (
              <X className="h-6 w-6" />
            ) : isCollapsed ? (
              <ChevronRight className="h-6 w-6" />
            ) : (
              <ChevronLeft className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col space-y-3 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const hasAccess = canAccess(userRole, item.resource);

            if (!hasAccess) return null;

            return (
              <Link
                href={item.path}
                key={item.path}
                className={`
                  flex items-center px-4 py-3 rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? 'bg-textBlack dark:bg-gray-600 text-white font-bold'
                      : 'bg-white dark:bg-gray-700 text-textBlack dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md'
                  }
                  ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}
                `}
                onClick={isMobileOpen ? onClose : undefined}
              >
                {isCollapsed && !isMobileOpen ? (
                  <span className="text-lg">{item.name[0]}</span>
                ) : (
                  item.name
                )}
              </Link>
            );
          })}
        </nav>

        {/* Dark Mode Toggle (Mobile Only) */}
        {isMobileOpen && (
          <button
            onClick={() => {
              toggleDarkMode();
              onClose();
            }}
            className="lg:hidden mt-4 p-2 rounded-full bg-gray-700 dark:bg-gray-600 text-white hover:bg-highlightBlue transition-all duration-200 text-sm font-medium"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        )}
      </div>
    </>
  );
};

export default Sidebar;