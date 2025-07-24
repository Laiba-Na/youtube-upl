import NextAuth, {
  User,
  NextAuthOptions,
  Session,
  DefaultSession,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  PrismaClient,
  User as PrismaUser,
  GoogleAccount,
  FacebookAccount,
} from "@prisma/client";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

// Extend NextAuth types to match Prisma schema
declare module "next-auth" {
  interface User extends PrismaUser {
    googleAccounts?: GoogleAccount[];
    facebookAccounts?: FacebookAccount[];
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      googleAccounts?: Pick<
        GoogleAccount,
        | "id"
        | "googleEmail"
        | "providerAccountId"
        | "refreshToken"
        | "accessToken"
      >[];
      facebookAccounts?: Pick<
        FacebookAccount,
        "id" | "providerAccountId" | "pageId" | "pageName" | "accessToken"
      >[];
    } & DefaultSession["user"];
    googleRefreshToken?: string | null; // Allow null to match Prisma schema
    googleAccessToken?: string | null | undefined; // Allow null to match Prisma schema
    facebookAccessToken?: string | null | undefined; // Allow null to match Prisma schema
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { googleAccounts: true, facebookAccounts: true },
          });
          console.log("Credentials authorize user:", user);
          if (!user || !user.password) {
            throw new Error("User not found or password not set");
          }
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }
          return user as User;
        } catch (error) {
          console.error("Credentials authorize error:", error);
          throw error;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope:
            "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope:
            "email,pages_show_list,pages_read_engagement,read_insights,pages_manage_posts,pages_manage_metadata,pages_manage_engagement",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        try {
          console.log(`Google sign-in attempt for email: ${user.email}`);
          console.log("Google account:", account);
          const session = await getServerSession(authOptions);
          let existingUserId = session?.user?.id;

          return await prisma.$transaction(async (tx) => {
            let existingUser: PrismaUser | null = existingUserId
              ? await tx.user.findUnique({
                  where: { id: existingUserId },
                  include: { googleAccounts: true, facebookAccounts: true },
                })
              : await tx.user.findUnique({
                  where: { email: user.email },
                  include: { googleAccounts: true, facebookAccounts: true },
                });

            console.log("Existing user:", existingUser);

            if (!existingUser) {
              console.log(`Creating new user for: ${user.email}`);
              existingUser = await tx.user.create({
                data: {
                  name: user.name || "",
                  email: user.email,
                  password: await bcrypt.hash(crypto.randomUUID(), 12),
                },
              });
            }

            if (!existingUser) {
              throw new Error("Failed to create or find user");
            }

            const existingGoogleAccount = await tx.googleAccount.findFirst({
              where: {
                providerAccountId: account.providerAccountId,
                provider: account.provider,
              },
            });

            if (existingGoogleAccount) {
              console.log(
                `Updating Google account: ${existingGoogleAccount.id}`
              );
              await tx.googleAccount.update({
                where: { id: existingGoogleAccount.id },
                data: {
                  refreshToken:
                    account.refresh_token || existingGoogleAccount.refreshToken,
                  accessToken:
                    account.access_token || existingGoogleAccount.accessToken,
                  expiresAt: account.expires_at
                    ? new Date(account.expires_at * 1000)
                    : existingGoogleAccount.expiresAt,
                  userId: existingUser.id,
                },
              });
            } else {
              console.log(`Creating new Google account for: ${user.email}`);
              if (!account.refresh_token) {
                console.warn(
                  "No refresh token provided by Google OAuth. Using empty string as fallback."
                );
              }
              await tx.googleAccount.create({
                data: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  googleEmail: user.email,
                  refreshToken: account.refresh_token || "",
                  accessToken: account.access_token || null,
                  expiresAt: account.expires_at
                    ? new Date(account.expires_at * 1000)
                    : null,
                  userId: existingUser.id,
                },
              });
            }

            user.id = existingUser.id;
            return true;
          });
        } catch (error) {
          console.error("Google signIn error:", error);
          return false;
        }
      }

      if (account?.provider === "facebook" && user.email) {
        try {
          console.log(`Facebook sign-in attempt for email: ${user.email}`);
          console.log("Facebook account:", account);
          const session = await getServerSession(authOptions);
          let existingUserId = session?.user?.id;

          return await prisma.$transaction(async (tx) => {
            let existingUser: PrismaUser | null = existingUserId
              ? await tx.user.findUnique({
                  where: { id: existingUserId },
                  include: { googleAccounts: true, facebookAccounts: true },
                })
              : await tx.user.findUnique({
                  where: { email: user.email },
                  include: { googleAccounts: true, facebookAccounts: true },
                });

            console.log("Existing user:", existingUser);

            if (!existingUser) {
              console.log(`Creating new user for: ${user.email}`);
              existingUser = await tx.user.create({
                data: {
                  name: user.name || "",
                  email: user.email,
                  password: await bcrypt.hash(crypto.randomUUID(), 12),
                },
              });
            }

            if (!existingUser) {
              throw new Error("Failed to create or find user");
            }

            const existingFacebookAccount = await tx.facebookAccount.findFirst({
              where: {
                providerAccountId: account.providerAccountId,
                provider: account.provider,
              },
            });

            if (existingFacebookAccount) {
              console.log(
                `Updating Facebook account: ${existingFacebookAccount.id}`
              );
              await tx.facebookAccount.update({
                where: { id: existingFacebookAccount.id },
                data: {
                  accessToken: account.access_token!,
                  refreshToken:
                    account.refresh_token ||
                    existingFacebookAccount.refreshToken,
                  expiresAt: account.expires_at
                    ? new Date(account.expires_at * 1000)
                    : existingFacebookAccount.expiresAt,
                  tokenType:
                    account.token_type || existingFacebookAccount.tokenType,
                  scope: account.scope || existingFacebookAccount.scope,
                  pageId: existingFacebookAccount.pageId || null,
                  pageName: existingFacebookAccount.pageName || null,
                  userId: existingUser.id,
                },
              });
            } else {
              console.log(`Creating new Facebook account for: ${user.email}`);
              await tx.facebookAccount.create({
                data: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  accessToken: account.access_token!,
                  refreshToken: account.refresh_token || null,
                  expiresAt: account.expires_at
                    ? new Date(account.expires_at * 1000)
                    : null,
                  tokenType: account.token_type || null,
                  scope: account.scope || null,
                  pageId: null,
                  pageName: null,
                  userId: existingUser.id,
                },
              });
            }

            user.id = existingUser.id;
            return true;
          });
        } catch (error) {
          console.error("Facebook signIn error:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }

      if (account) {
        if (account.provider === "google") {
          token.googleRefreshToken = account.refresh_token;
          token.googleAccessToken = account.access_token;
          token.googleExpiresAt = account.expires_at;
          token.googleEmail = user.email;
        }
        if (account.provider === "facebook") {
          token.facebookAccessToken = account.access_token;
          token.facebookRefreshToken = account.refresh_token;
          token.facebookExpiresAt = account.expires_at;
          token.facebookEmail = user.email;
          token.facebookProviderId = account.providerAccountId;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;

        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { googleAccounts: true, facebookAccounts: true },
        });

        console.log("Session user:", user);

        if (user) {
          session.user.name = user.name;
          session.user.email = user.email;
          session.user.googleAccounts =
            user.googleAccounts?.map((acc) => ({
              id: acc.id,
              googleEmail: acc.googleEmail,
              providerAccountId: acc.providerAccountId,
              refreshToken: acc.refreshToken,
              accessToken: acc.accessToken,
            })) || [];
          session.user.facebookAccounts =
            user.facebookAccounts?.map((acc) => ({
              id: acc.id,
              providerAccountId: acc.providerAccountId,
              pageId: acc.pageId,
              pageName: acc.pageName,
              accessToken: acc.accessToken,
            })) || [];

          const googleAccount = user.googleAccounts?.[0];
          if (googleAccount?.refreshToken) {
            session.googleRefreshToken = googleAccount.refreshToken;
            session.googleAccessToken = googleAccount.accessToken; // Type is string | null
          }
          const facebookAccount = user.facebookAccounts?.[0];
          if (facebookAccount?.accessToken) {
            session.facebookAccessToken = facebookAccount.accessToken; // Type is string | null
          }
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
