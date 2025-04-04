// api/auth/[...nextauth]/route.ts
import NextAuth, { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { GoogleAccount, PrismaClient } from "@prisma/client";
import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) {
          throw new Error("User not found");
        }
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Only handle Google sign-in
      if (account?.provider === "google" && user.email) {
        try {
          console.log(`Google sign-in for email: ${user.email}`);
          
          // Get the current session to determine if user is already logged in
          const session = await getServerSession(authOptions);
          let existingUserId = session?.user?.id;
          
          // IMPORTANT: If user is already authenticated, use that user's ID
          if (existingUserId) {
            console.log(`Using existing authenticated user ID: ${existingUserId}`);
            
            // Find the authenticated user to ensure it exists
            const authenticatedUser = await prisma.user.findUnique({
              where: { id: existingUserId },
              include: { googleAccounts: true }
            });
            
            if (!authenticatedUser) {
              console.error(`Cannot find authenticated user with ID: ${existingUserId}`);
              return false;
            }
            
            // Start a transaction
            await prisma.$transaction(async (tx) => {
              // Check if this specific Google account connection already exists
              const existingGoogleAccount = await tx.googleAccount.findFirst({
                where: {
                  providerAccountId: account.providerAccountId,
                  provider: account.provider,
                },
              });
              
              if (existingGoogleAccount) {
                console.log(`Updating existing Google account: ${existingGoogleAccount.id}`);
                // Update the refresh token if a new one is provided
                await tx.googleAccount.update({
                  where: { id: existingGoogleAccount.id },
                  data: {
                    refreshToken: account.refresh_token || existingGoogleAccount.refreshToken,
                    userId: authenticatedUser.id, // Link to the authenticated user
                  },
                });
              } else {
                console.log(`Creating new Google account connection for: ${user.email}`);
                // Create a new Google account connection
                await tx.googleAccount.create({
                  data: {
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    googleEmail: user.email || "",
                    refreshToken: account.refresh_token!,
                    userId: authenticatedUser.id, // Link to the authenticated user
                  },
                });
              }
            });
            
            // Very important: Set the user ID to the authenticated user
            user.id = authenticatedUser.id;
          } else {
            // No authenticated user, handle regular sign-in process
            // Check if this email already exists as a user
            let existingUser: (User & { googleAccounts?: GoogleAccount[] }) | null = await prisma.user.findUnique({
              where: { email: user.email },
              include: { googleAccounts: true }
            });
            
            // Start a transaction to ensure consistency
            await prisma.$transaction(async (tx) => {
              // If user doesn't exist, create a new user
              if (!existingUser) {
                console.log(`Creating new user for: ${user.email}`);
                existingUser = await tx.user.create({
                  data: {
                    name: user.name || "",
                    email: user.email || "",
                    // Create a random password placeholder
                    password: await bcrypt.hash(crypto.randomUUID(), 12),
                  },
                });
              } else {
                console.log(`User already exists: ${existingUser.id}`);
              }
              
              // Check if this specific Google account connection already exists
              const existingGoogleAccount = await tx.googleAccount.findFirst({
                where: {
                  providerAccountId: account.providerAccountId,
                  provider: account.provider,
                },
              });
              
              if (existingGoogleAccount) {
                console.log(`Updating existing Google account: ${existingGoogleAccount.id}`);
                // Update the refresh token if a new one is provided
                await tx.googleAccount.update({
                  where: { id: existingGoogleAccount.id },
                  data: {
                    refreshToken: account.refresh_token || existingGoogleAccount.refreshToken,
                    userId: existingUser.id, // Ensure it's linked to the correct user
                  },
                });
              } else {
                console.log(`Creating new Google account connection for: ${user.email}`);
                // Create a new Google account connection
                await tx.googleAccount.create({
                  data: {
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    googleEmail: user.email || "",
                    refreshToken: account.refresh_token!,
                    userId: existingUser.id,
                  },
                });
              }
            });
            
            // Very important: Set the correct user ID to prevent duplication
            user.id = existingUser!.id;
          }
          return true;
        } catch (error) {
          console.error("Error in Google signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    
    async jwt({ token, user, account }) {
      // On first sign in
      if (user) {
        token.id = user.id;
      }
      
      // If this is a Google connection (not used for login but for connecting YouTube)
      if (account && account.provider === "google") {
        // Store Google tokens temporarily in the JWT
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
        token.googleEmail = user.email!;
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        
        // Load Google accounts for this user
        const googleAccounts = await prisma.googleAccount.findMany({
          where: { userId: token.id as string },
          select: { 
            id: true, 
            googleEmail: true,
            providerAccountId: true 
          },
        });
        
        // Add Google accounts to session
        session.user.googleAccounts = googleAccounts;
        
        // If we have temporary Google credentials, add them to session
        if (token.googleAccessToken && token.googleRefreshToken && token.googleEmail) {
          session.googleConnection = {
            accessToken: token.googleAccessToken,
            refreshToken: token.googleRefreshToken,
            email: token.googleEmail
          };
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };