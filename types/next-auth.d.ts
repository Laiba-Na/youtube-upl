import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    googleConnected?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
      googleConnected?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    googleConnected?: boolean;
    refreshToken?: string;
  }
}