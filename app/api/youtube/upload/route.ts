import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { Readable } from 'stream';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    console.log("Starting video upload process");
    
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("Upload failed: User not authenticated");
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    console.log("User authenticated:", session.user.email);

    // Get the form data
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;
    const videoFile = formData.get('videoFile') as File;
    const thumbnailFile = formData.get('thumbnailFile') as File;
    const madeForKids = formData.get('madeForKids') === 'true';
    const privacyStatus = formData.get('privacyStatus') as string;
    const playlistId = formData.get('playlistId') as string;
    const googleAccountId = formData.get('googleAccountId') as string;
    
    // Log received form data for debugging
    console.log("Form data received:", {
      title: title ? "Present" : "Missing",
      description: description ? "Present" : "Missing",
      tags: tags ? "Present" : "Missing",
      videoFile: videoFile ? `${videoFile.name} (${videoFile.size} bytes)` : "Missing",
      thumbnailFile: thumbnailFile ? `${thumbnailFile.name} (${thumbnailFile.size} bytes)` : "None",
      madeForKids,
      privacyStatus,
      playlistId: playlistId || "None",
      googleAccountId: googleAccountId || "None"
    });
    
    if (!title || !description || !videoFile || !privacyStatus || !googleAccountId) {
      console.log("Upload failed: Missing required fields");
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Get the user from the database (only need id and email now)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    });

    if (!user) {
      console.log("Upload failed: User not found in database");
      return new NextResponse('User not found', { status: 404 });
    }
    
    // Get the user's Google account (to retrieve the refresh token)
    const googleAccount = await prisma.googleAccount.findFirst({
      where: {
        userId: user.id,
        id: googleAccountId
      },
      select: { refreshToken: true }
    });

    if (!googleAccount) {
      console.log("Upload failed: Google account not found");
      return new NextResponse('Google account not found. Please reconnect your Google account.', { status: 404 });
    }

    // Initialize the OAuth2 client with the refresh token from GoogleAccount
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL
    );

    console.log("OAuth client initialized");

    // Log refresh token (first few chars for debugging)
    const tokenPreview = googleAccount.refreshToken.substring(0, 5) + "...";
    console.log(`Using refresh token: ${tokenPreview}`);

    oauth2Client.setCredentials({
      refresh_token: googleAccount.refreshToken,
    });

    // Refresh the access token
    try {
      console.log("Refreshing access token");
      const { credentials } = await oauth2Client.refreshAccessToken();
      console.log("Access token refreshed successfully");
      oauth2Client.setCredentials(credentials);
    } catch (tokenError) {
      console.error("Error refreshing access token:", tokenError);
      return new NextResponse('Failed to authenticate with YouTube. Please reconnect your Google account.', { status: 401 });
    }

    // Initialize YouTube client
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    console.log("YouTube client initialized");

    // Convert the video file to a buffer and create a readable stream.
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    // Upload the video
    try {
      const res = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title,
            description,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
          },
          status: {
            privacyStatus, // 'private', 'public', or 'unlisted'
            selfDeclaredMadeForKids: madeForKids,
          },
        },
        media: {
          body: bufferStream,
        },
      });

      const videoId = res.data.id as string;
      console.log("Video uploaded successfully:", videoId);

      // If thumbnail was provided, upload it.
      if (thumbnailFile) {
        try {
          const thumbnailArrayBuffer = await thumbnailFile.arrayBuffer();
          const thumbnailBuffer = Buffer.from(thumbnailArrayBuffer);
          await youtube.thumbnails.set({
            videoId: videoId,
            media: {
              body: Readable.from(thumbnailBuffer),
            },
          });
          console.log("Thumbnail uploaded successfully");
        } catch (thumbnailError: any) {
          console.error("Error uploading thumbnail:", thumbnailError.message || thumbnailError);
        }
      }

      // If a playlist ID was provided, add the video to the playlist.
      if (playlistId) {
        try {
          await youtube.playlistItems.insert({
            part: ['snippet'],
            requestBody: {
              snippet: {
                playlistId: playlistId,
                resourceId: {
                  kind: 'youtube#video',
                  videoId: videoId,
                },
              },
            },
          });
          console.log("Video added to playlist successfully");
        } catch (playlistError: any) {
          console.error("Error adding to playlist:", playlistError.message || playlistError);
        }
      }

      return NextResponse.json({
        message: 'Video uploaded successfully',
        videoId: videoId,
      });
    } catch (youtubeError: any) {
      console.error("YouTube API error:", youtubeError.message || youtubeError);
      if (youtubeError.message && youtubeError.message.includes("quota")) {
        return new NextResponse('YouTube API quota exceeded. Please try again later.', { status: 429 });
      }
      if (youtubeError.message && youtubeError.message.includes("permission")) {
        return new NextResponse('Insufficient permissions. Please reconnect your Google account with appropriate permissions.', { status: 403 });
      }
      return new NextResponse(`YouTube upload failed: ${youtubeError.message || 'Unknown error'}`, { status: 500 });
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return new NextResponse(`Error uploading video: ${error.message || 'Unknown error'}`, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
