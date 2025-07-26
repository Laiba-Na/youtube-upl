// components/Sidebar.tsx
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { canAccess } from "../utils/permissions";

type NavItem = {
  name: string;
  path: string;
  resource: string; // Match with permission names
};

const navItems: NavItem[] = [
  { name: "DASHBOARD", path: "/DASHBOARD", resource: "DASHBOARD" },
  { name: "POST CATALOG", path: "/POST_CATALOG", resource: "POST_CATALOG" },
  { name: "CREATE POST", path: "/POST_EDITING", resource: "POST_EDITING" },
  { name: "ANALYTICS", path: "/ANALYTICS", resource: "ANALYTICS" },
  { name: "CALENDAR", path: "/CALENDAR", resource: "CALENDAR" },
  { name: "POST MEDIA", path: "/POST_MEDIA", resource: "POST_MEDIA" },
  { name: "TEAM SETUP", path: "/SETTINGS/TEAM_SETUP", resource: "TEAM_SETUP" },
  { name: "SETTINGS", path: "/SETTINGS", resource: "SETTINGS" },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Get user's role from session (this will need to be added to session)
  const userRole = session?.user?.role || Role.MEMBER;

  return (
    <div className="h-[100vh] bg-gradient-to-b from-primaryRed via-pink-600 to-primaryPurple place-content-center p-4">
      <nav className="flex flex-col space-y-5">
        {navItems.map((item) => {
          const isActive = pathname === item.path;

          // Check if user has permission to see this item
          const hasAccess = canAccess(userRole, item.resource);

          // Skip rendering items the user can't access
          if (!hasAccess) return null;

          return (
            <Link
              href={item.path}
              key={item.path}
              className={`
                py-4 px-6 rounded-full text-center transition-all duration-200
                ${
                  isActive
                    ? "bg-textBlack text-white font-bold"
                    : "bg-white text-textBlack hover:bg-gray-200 hover:shadow-md"
                }
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
