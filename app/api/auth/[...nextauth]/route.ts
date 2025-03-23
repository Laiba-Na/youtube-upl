// Update in [...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { NextAuthOptions } from "next-auth";

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
          where: {
            email: credentials.email,
          },
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
          image: user.image,
          googleConnected: user.googleConnected,
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
      // If signing in with Google, update the user record
      if (account?.provider === "google" && user.email) {
        try {
          // Find user by email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // If user exists, update with Google connection info
          if (existingUser) {
            await prisma.user.update({
              where: { email: user.email },
              data: {
                googleConnected: true,
                googleRefreshToken: account.refresh_token,
                // Update other fields if needed
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
              },
            });
          } else {
            // Optional: Create a new user if they don't exist
            // This depends on your app's requirements
          }
        } catch (error) {
          console.error("Error updating user after Google sign-in:", error);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Add user data to token when initially signing in
      if (user) {
        token.id = user.id;
        token.googleConnected = (user as any).googleConnected;
      }

      // Store the Google refresh token when received
      if (account && account.provider === "google" && account.refresh_token) {
        token.refreshToken = account.refresh_token;
        token.googleConnected = true; // Explicitly set this to true
        
        // User data is updated in the signIn callback instead
      }

      // If this is a Google login, fetch the latest user data from the database
      if (account?.provider === "google" && token.email) {
        try {
          const updatedUser = await prisma.user.findUnique({
            where: { email: token.email as string },
          });
          
          if (updatedUser) {
            token.googleConnected = updatedUser.googleConnected;
          }
        } catch (error) {
          console.error("Error fetching updated user data:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.googleConnected = token.googleConnected as boolean;
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
  debug: process.env.NODE_ENV === "development", // Enable debug mode in development
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };