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

      // Allow public pages without auth
      const publicPaths = ["/login", "/register", "/login/2fa"];
      if (publicPaths.includes(pathname)) {
        return true;
      }

      // If there's no token, deny access
      if (!token) {
        return false;
      }

      // Route-to-resource mapping
      const routeToResourceMap = {
        "/Dashboard": "DASHBOARD",
        "/posts": "POST_CATALOG",
        "/Editordashboard": "POST_EDITING",
        "/Analytics": "ANALYTICS",
        "/calendar": "CALENDAR",
        "/PostMedia": "POST_MEDIA",
        "/team-setup": "TEAM_SETUP",
        "/settings": "SETTINGS",
      } as const;

      const resource =
        routeToResourceMap[pathname as keyof typeof routeToResourceMap];

      // If the route is protected and the user lacks permission
      if (resource) {
        if (!token.role || !canAccess(token.role, resource)) {
          return false;
        }
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
    "/api/auth/getUserId",
  ],
};
