// components/Sidebar.tsx
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  name: string;
  path: string;
};

const navItems: NavItem[] = [
  { name: 'DASHBOARD', path: '/Dashboard' },
  { name: 'POST CATALOG', path: '/posts' },
  { name: 'POST EDITING', path: '/Editordashboard' },
  { name: 'ANALYTICS', path: '/analytics' },
  { name: 'CALENDAR', path: '/calendar' },
  { name: 'POST MEDIA', path: '/PostMedia' },
  { name: 'TEAM SETUP', path: '/team-setup' },
  { name: 'SETTINGS', path: '/settings' },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className=" h-[100vh] bg-gradient-to-b from-primaryRed via-pink-600 to-primaryPurple place-content-center p-4">
      <nav className="flex flex-col space-y-5">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              href={item.path}
              key={item.path}
              className={`
                py-4 px-6 rounded-full text-center transition-all duration-200
                ${
                  isActive
                    ? 'bg-textBlack text-white font-bold'
                    : 'bg-white text-textBlack hover:bg-gray-200 hover:shadow-md'
                }7
              `}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;