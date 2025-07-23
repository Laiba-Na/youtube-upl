import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth({
  pages: {
    signIn: "/login",
    verifyRequest: "/login/2fa", // Explicitly set for 2FA flow
  },
  callbacks: {
    authorized: ({ token, req }) => {
      const { pathname } = req.nextUrl;

      // Define public paths that don't require authentication
      const publicPaths = ["/login", "/register", "/login/2fa"];
      if (publicPaths.includes(pathname)) {
        return true; // Allow access to public paths
      }

      // Require token for protected routes
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/", 
    "/connect-google", 
    "/upload", 
    "/dashboard", 
    "/settings/:path*", 
    "/social-links",
    "/api/auth/getUserId"
  ],
};