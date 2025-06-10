// types/next-auth.d.ts
import "next-auth";
import { GoogleAccount, FacebookAccount } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    googleAccounts?: Pick<GoogleAccount, 'id' | 'googleEmail' | 'providerAccountId'>[];
    facebookAccounts?: Pick<FacebookAccount, 'id' | 'providerAccountId' | 'pageId' | 'pageName'>[];
  }

  interface Session {
    user: User;
    googleConnection?: {
      accessToken: string;
      refreshToken: string;
      email: string;
    };
    facebookConnection?: {
      accessToken: string;
      refreshToken: string | null;
      email: string;
      providerAccountId: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleEmail?: string;
    facebookAccessToken?: string;
    facebookRefreshToken?: string | null;
    facebookEmail?: string;
    facebookProviderId?: string;
  }
}