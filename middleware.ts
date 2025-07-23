// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canAccess } from "./utils/permissions";

export default withAuth({
  pages: {
    signIn: "/login",
    verifyRequest: "/login/2fa",
  },
  callbacks: {
    authorized: ({ token, req }) => {
      const { pathname } = req.nextUrl;

      // Define public paths that don't require authentication
      const publicPaths = ["/login", "/register", "/login/2fa"];
      if (publicPaths.includes(pathname)) {
        return true; // Allow access to public paths
      }

      // If no token, redirect to login
      if (!token) {
        return false;
      }

      // Check resource permissions for protected routes
      const routeToResourceMap = {
        '/Dashboard': 'DASHBOARD',
        '/posts': 'POST_CATALOG',
        '/Editordashboard': 'POST_EDITING',
        '/Analytics': 'ANALYTICS',
        '/calendar': 'CALENDAR',
        '/PostMedia': 'POST_MEDIA',
        '/team-setup': 'TEAM_SETUP',
        '/settings': 'SETTINGS',
      } as const;

      const resource = routeToResourceMap[pathname as keyof typeof routeToResourceMap];
      
      // If this is a protected resource and user's role doesn't have access
      if (resource && !canAccess(token.role, resource)) {
        // Redirect to dashboard or show access denied
        return false;
      }

      return true;
    },
  },
});

export const config = {
  matcher: [
    "/",
    "/Dashboard",
    "/posts",
    "/Editordashboard",
    "/Analytics",
    "/calendar",
    "/PostMedia",
    "/team-setup",
    "/settings",
    "/connect-google", 
    "/upload", 
    "/social-links",
    "/api/auth/getUserId"
  ],
};