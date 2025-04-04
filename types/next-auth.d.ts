// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    googleAccounts?: { id: string; googleEmail: string }[];
  }

  interface Session {
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
      googleAccounts?: { id: string; googleEmail: string }[];
    };
    googleConnection?: {
      accessToken: string;
      refreshToken: string;
      email: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleEmail?: string;
  }
}