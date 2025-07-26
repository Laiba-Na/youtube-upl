import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { Readable } from "stream";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("video") as File;
    const scheduledAt = formData.get("scheduledAt") as string;
    const content = formData.get("content") as string;
    const description = formData.get("description") as string;
    const tags = formData.get("tags") as string;
    const privacyStatus = formData.get("privacyStatus") as string;
    const googleAccountId = formData.get("googleAccountId") as string;

    if (
      !file ||
      !scheduledAt ||
      !content ||
      !privacyStatus ||
      !googleAccountId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: video, scheduledAt, content, privacyStatus, or googleAccountId",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const googleAccount = await prisma.googleAccount.findFirst({
      where: { userId: user.id, id: googleAccountId },
      select: { refreshToken: true },
    });

    if (!googleAccount) {
      return NextResponse.json(
        {
          error:
            "Google account not found. Please reconnect your Google account.",
        },
        { status: 404 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL
    );

    oauth2Client.setCredentials({ refresh_token: googleAccount.refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    const scheduledDate = new Date(scheduledAt);
    const currentTime = new Date();
    const delay = scheduledDate.getTime() - currentTime.getTime();

    if (delay <= 0) {
      const res = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: content,
            description,
            tags: tags ? tags.split(",").map((tag) => tag.trim()) : undefined,
          },
          status: { privacyStatus },
        },
        media: { body: bufferStream },
      });

      const videoId = res.data.id as string;
      return NextResponse.json(
        { url: `https://youtube.com/watch?v=${videoId}`, videoId },
        { status: 200 }
      );
    } else {
      setTimeout(async () => {
        try {
          const res = await youtube.videos.insert({
            part: ["snippet", "status"],
            requestBody: {
              snippet: {
                title: content,
                description,
                tags: tags
                  ? tags.split(",").map((tag) => tag.trim())
                  : undefined,
              },
              status: { privacyStatus },
            },
            media: { body: bufferStream },
          });

          const videoId = res.data.id as string;
          console.log(
            `Video ${videoId} uploaded at ${new Date().toISOString()}`
          );
        } catch (error) {
          console.error("Scheduled upload failed:", error);
        }
      }, delay);

      return NextResponse.json(
        { url: null, message: `Video scheduled for upload at ${scheduledAt}` },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Upload error details:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload video",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
