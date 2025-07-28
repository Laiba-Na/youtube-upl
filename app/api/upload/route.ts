import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { Readable } from "stream";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    console.log("Starting video upload process");

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("Upload failed: User not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", session.user.email);

    const formData = await request.formData();
    const file = formData.get("video") as File;
    const scheduledAt = formData.get("scheduledAt") as string;
    const content = formData.get("content") as string;
    const description = (formData.get("description") as string) || content; // Default to content if no description
    const tags = formData.get("tags") as string;
    const privacyStatus = (formData.get("privacyStatus") as string) || "public"; // Default to public
    const googleAccountId = formData.get("googleAccountId") as string;

    console.log("Form data received:", {
      content: content ? "Present" : "Missing",
      description: description ? "Present" : "Missing",
      tags: tags ? "Present" : "Missing",
      videoFile: file ? `${file.name} (${file.size} bytes)` : "Missing",
      scheduledAt: scheduledAt ? "Present" : "Missing",
      privacyStatus: privacyStatus,
      googleAccountId: googleAccountId || "None",
    });

    if (!file || !scheduledAt || !content || !googleAccountId) {
      console.log("Upload failed: Missing required fields");
      return NextResponse.json(
        {
          error:
            "Missing required fields: video, scheduledAt, content, or googleAccountId",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (!user) {
      console.log("Upload failed: User not found in database");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const googleAccount = await prisma.googleAccount.findFirst({
      where: { userId: user.id, id: googleAccountId },
      select: { refreshToken: true },
    });

    if (!googleAccount) {
      console.log("Upload failed: Google account not found");
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

    console.log("OAuth client initialized");
    oauth2Client.setCredentials({ refresh_token: googleAccount.refreshToken });

    try {
      console.log("Refreshing access token");
      const { credentials } = await oauth2Client.refreshAccessToken();
      console.log("Access token refreshed successfully");
      oauth2Client.setCredentials(credentials);
    } catch (tokenError) {
      console.error("Error refreshing access token:", tokenError);
      return NextResponse.json(
        {
          error:
            "Failed to authenticate with YouTube. Please reconnect your Google account.",
        },
        { status: 401 }
      );
    }

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    console.log("YouTube client initialized");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const scheduledDate = new Date(scheduledAt);
    const currentTime = new Date();
    const delay = scheduledDate.getTime() - currentTime.getTime();

    if (delay <= 0) {
      const bufferStream = new Readable();
      bufferStream.push(buffer);
      bufferStream.push(null);

      const res = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: content,
            description: description,
            tags: tags ? tags.split(",").map((tag) => tag.trim()) : undefined,
          },
          status: {
            privacyStatus: privacyStatus,
            selfDeclaredMadeForKids: false,
          },
        },
        media: { body: bufferStream },
      });

      const videoId = res.data.id as string;
      console.log("Video uploaded successfully:", videoId);
      return NextResponse.json(
        { url: `https://youtube.com/watch?v=${videoId}`, videoId },
        { status: 200 }
      );
    } else {
      scheduleUpload(
        youtube,
        buffer,
        content,
        description,
        tags,
        privacyStatus,
        scheduledDate
      );

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

async function scheduleUpload(
  youtube: any,
  buffer: Buffer,
  content: string,
  description: string,
  tags: string,
  privacyStatus: string,
  scheduledDate: Date
) {
  const delay = scheduledDate.getTime() - new Date().getTime();
  if (delay > 0) {
    console.log(
      `Scheduling upload for ${scheduledDate.toISOString()} with delay ${delay}ms`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    try {
      const res = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: content,
            description: description,
            tags: tags ? tags.split(",").map((tag) => tag.trim()) : undefined,
          },
          status: {
            privacyStatus: privacyStatus,
            selfDeclaredMadeForKids: false,
          },
        },
        media: { body: bufferStream },
      });

      const videoId = res.data.id as string;
      console.log(`Video ${videoId} uploaded at ${new Date().toISOString()}`);
    } catch (error) {
      console.error("Scheduled upload failed:", error);
    }
  }
}