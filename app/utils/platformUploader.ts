import { SocialPost } from "@prisma/client";
import { google } from "googleapis";
import nodemailer from "nodemailer";
import axios from "axios";
import { prisma } from "lib/prisma";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/auth/callback/google"
);

export async function refreshAccessToken(
  refreshToken: string
): Promise<string> {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { token } = await oauth2Client.getAccessToken();
    if (!token) {
      throw new Error("Failed to refresh access token");
    }
    return token;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new Error("Failed to refresh access token");
  }
}

export async function postToYouTube(
  refreshToken: string,
  content: string,
  mediaUrl?: string | null
) {
  try {
    const accessToken = await refreshAccessToken(refreshToken);

    const youtube = google.youtube({
      version: "v3",
      auth: accessToken,
    });

    let fileStream;
    if (mediaUrl && typeof mediaUrl === "string") {
      try {
        const response = await axios.get(mediaUrl, { responseType: "stream" });
        fileStream = response.data;
      } catch (error) {
        console.error("Error fetching media URL:", error);
        throw new Error("Invalid media URL");
      }
    }

    const videoMetadata = {
      snippet: {
        title: content.substring(0, 100),
        description: content,
        tags: ["uploaded", "scheduled"],
      },
      status: {
        privacyStatus: "private", // Change to 'public' or 'unlisted' as needed
        publishAt: new Date().toISOString(), // Schedule for immediate publish
      },
    };

    let response;
    if (fileStream) {
      response = await youtube.videos.insert(
        {
          part: ["snippet", "status"],
          media: { body: fileStream },
          requestBody: videoMetadata,
        },
        { maxRedirects: 5 }
      );
    } else {
      response = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: videoMetadata,
      });
    }

    if (response.data.id) {
      console.log("Video uploaded with ID:", response.data.id);
    }
    return response.data;
  } catch (error) {
    console.error("YouTube upload error:", error);
    throw error;
  }
}

export async function notifyUser(
  userId: string,
  platform: string,
  content: string,
  scheduledAt: Date
) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.email) {
      throw new Error("User or email not found");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "maryamshabir025@gmail.com",
        pass: process.env.EMAIL_PASS || "tijt hswt nmau dkso", // Use environment variables
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || "maryamshabir025@gmail.com",
      to: user.email,
      subject: `Scheduled Post Notification for ${platform}`,
      text: `Your post "${content.substring(
        0,
        50
      )}..." is scheduled for ${scheduledAt.toLocaleString()} on ${platform}. Please upload it manually.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Notification sent to ${user.email} for ${platform}`);
  } catch (error) {
    console.error("Email notification error:", error);
    throw error;
  }
}
