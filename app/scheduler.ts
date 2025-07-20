import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";
import cron from "node-cron";
import { notifyUser } from "@/lib/notify";

const prisma = new PrismaClient();

export async function startScheduler() {
  console.log("Starting scheduler...");
  cron.schedule("*/5 * * * *", async () => {
    console.log("Running scheduler at", new Date().toISOString());
    try {
      const posts = await prisma.socialPost.findMany({
        where: {
          scheduledAt: { lte: new Date() },
          status: "SCHEDULED",
        },
        select: {
          id: true,
          postTitle: true,
          content: true,
          mediaUrl: true,
          platform: true,
          scheduledAt: true,
          status: true,
          userId: true,
          user: {
            select: {
              id: true,
              email: true,
              googleAccounts: {
                select: {
                  id: true,
                  googleEmail: true,
                  accessToken: true,
                  refreshToken: true,
                  expiresAt: true,
                  providerAccountId: true,
                },
              },
            },
          },
        },
      });

      console.log("Found posts:", posts.length);
      console.log("Posts data:", JSON.stringify(posts, null, 2));

      for (const post of posts) {
        console.log("Processing post:", post.id, post.postTitle);

        // Send confirmation email to user
        const emailSent = await notifyUser(
          post.user.email,
          "Post Scheduled",
          `Your post "${
            post.postTitle
          }" has been scheduled for YouTube at ${post.scheduledAt.toISOString()}.`
        );
        console.log(
          `Schedule confirmation email sent to ${post.user.email}: ${emailSent}`
        );

        const googleAccount = post.user.googleAccounts[0];
        if (!googleAccount?.accessToken) {
          console.error(`No access token for user ${post.userId}`);
          const emailSent = await notifyUser(
            post.user.email,
            "Post Failed",
            `Failed to post "${post.postTitle}" to YouTube: No access token available.`
          );
          console.log(`Email notification sent: ${emailSent}`);
          continue;
        }

        // Refresh token if expired
        let accessToken = googleAccount.accessToken;
        if (googleAccount.expiresAt && googleAccount.expiresAt < new Date()) {
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
          );
          oauth2Client.setCredentials({
            refresh_token: googleAccount.refreshToken,
          });
          try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            if (!credentials.access_token) {
              console.error("No access token returned from refresh");
              const emailSent = await notifyUser(
                post.user.email,
                "Post Failed",
                `Failed to post "${post.postTitle}" to YouTube: No access token returned from refresh.`
              );
              console.log(`Email notification sent: ${emailSent}`);
              continue;
            }
            await prisma.googleAccount.update({
              where: { id: googleAccount.id },
              data: {
                accessToken: credentials.access_token,
                expiresAt: credentials.expiry_date
                  ? new Date(credentials.expiry_date)
                  : null,
              },
            });
            accessToken = credentials.access_token;
            console.log("Refreshed token for", googleAccount.googleEmail);
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Unknown error during token refresh";
            console.error("Token refresh error:", errorMessage);
            const emailSent = await notifyUser(
              post.user.email,
              "Post Failed",
              `Failed to post "${post.postTitle}" to YouTube: Token refresh error - ${errorMessage}`
            );
            console.log(`Email notification sent: ${emailSent}`);
            continue;
          }
        }

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const youtube = google.youtube({ version: "v3", auth: oauth2Client });
        try {
          await youtube.videos.insert({
            part: ["snippet", "status"],
            requestBody: {
              snippet: {
                title: post.postTitle,
                description: post.content || "",
                categoryId: "22", // People & Blogs
              },
              status: { privacyStatus: "public" },
            },
            media: { body: post.mediaUrl || undefined },
          });

          await prisma.socialPost.update({
            where: { id: post.id },
            data: { status: "POSTED" },
          });

          const emailSent = await notifyUser(
            post.user.email,
            "Post Published",
            `Your post "${post.postTitle}" was successfully published to YouTube.`
          );
          console.log(
            `Posted to YouTube: ${post.id}, Email sent: ${emailSent}`
          );
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Unknown error during YouTube post";
          console.error(`Failed to post ${post.id}:`, errorMessage);
          const emailSent = await notifyUser(
            post.user.email,
            "Post Failed",
            `Failed to post "${post.postTitle}" to YouTube: ${errorMessage}`
          );
          console.log(`Email notification sent: ${emailSent}`);
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown scheduler error";
      console.error("Scheduler error:", errorMessage);
    }
  });
}

if (require.main === module) {
  startScheduler().catch((error: unknown) => {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown startup error";
    console.error("Scheduler startup error:", errorMessage);
    process.exit(1);
  });
}
