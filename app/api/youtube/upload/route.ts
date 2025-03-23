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
    
    // Log received form data for debugging
    console.log("Form data received:", {
      title: title ? "Present" : "Missing",
      description: description ? "Present" : "Missing",
      tags: tags ? "Present" : "Missing",
      videoFile: videoFile ? `${videoFile.name} (${videoFile.size} bytes)` : "Missing",
      thumbnailFile: thumbnailFile ? `${thumbnailFile.name} (${thumbnailFile.size} bytes)` : "None",
      madeForKids: madeForKids,
      privacyStatus: privacyStatus,
      playlistId: playlistId || "None"
    });
    
    if (!title || !description || !videoFile || !privacyStatus) {
      console.log("Upload failed: Missing required fields");
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        email: true,
        googleConnected: true,
        googleRefreshToken: true
      }
    });

    console.log("User data from database:", {
      id: user?.id,
      email: user?.email,
      googleConnected: user?.googleConnected,
      hasRefreshToken: !!user?.googleRefreshToken
    });

    if (!user) {
      console.log("Upload failed: User not found in database");
      return new NextResponse('User not found', { status: 404 });
    }
    
    if (!user.googleRefreshToken) {
      console.log("Upload failed: Google refresh token not found");
      return new NextResponse('Google account not properly connected. Please reconnect your Google account.', { status: 400 });
    }

    // Initialize the OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL
    );

    console.log("OAuth client initialized");

    // Log refresh token (first few chars for debugging)
    const tokenPreview = user.googleRefreshToken.substring(0, 5) + "...";
    console.log(`Using refresh token: ${tokenPreview}`);

    // Set credentials using the refresh token
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    // Get a new access token
    try {
      console.log("Refreshing access token");
      const { credentials } = await oauth2Client.refreshAccessToken();
      console.log("Access token refreshed successfully");
      
      // Update credentials with the new access token
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

    // Convert the file to buffer
    console.log(`Converting file ${videoFile.name} (${videoFile.size} bytes) to buffer`);
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`File converted to buffer (${buffer.length} bytes)`);

    // Create a readable stream from the buffer
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null); // Mark the end of the stream

    // Set up the upload parameters
    console.log("Starting YouTube upload");
    
    try {
      // Upload the video
      const res = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title,
            description,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
          },
          status: {
            privacyStatus: privacyStatus, // 'private', 'public', or 'unlisted'
            selfDeclaredMadeForKids: madeForKids,
          },
        },
        media: {
          body: bufferStream,
        },
      });

      const videoId = res.data.id as string;
      console.log("Video uploaded successfully:", videoId);

      // If thumbnail was provided, upload it
      if (thumbnailFile) {
        try {
          console.log(`Uploading thumbnail: ${thumbnailFile.name}`);
          // Convert thumbnail to buffer
          const thumbnailArrayBuffer = await thumbnailFile.arrayBuffer();
          const thumbnailBuffer = Buffer.from(thumbnailArrayBuffer);

          // Upload the thumbnail
          await youtube.thumbnails.set({
            videoId: videoId,
            media: {
              body: Readable.from(thumbnailBuffer),
            },
          });
          console.log("Thumbnail uploaded successfully");
        } catch (thumbnailError: any) {
          console.error("Error uploading thumbnail:", thumbnailError.message || thumbnailError);
          // Don't fail the whole process if thumbnail upload fails
        }
      }

      // If playlist ID was provided, add the video to the playlist
      if (playlistId) {
        try {
          console.log(`Adding video to playlist: ${playlistId}`);
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
          // Don't fail the whole process if playlist addition fails
        }
      }

      return NextResponse.json({
        message: 'Video uploaded successfully',
        videoId: videoId,
      });
    } catch (youtubeError: any) {
      console.error("YouTube API error:", youtubeError.message || youtubeError);
      
      // Handle specific YouTube API errors
      if (youtubeError.message && youtubeError.message.includes("quota")) {
        return new NextResponse('YouTube API quota exceeded. Please try again later.', { status: 429 });
      }
      
      if (youtubeError.message && youtubeError.message.includes("permission")) {
        return new NextResponse('Insufficient permissions. Please reconnect your Google account with appropriate permissions.', { status: 403 });
      }
      
      return new NextResponse(
        `YouTube upload failed: ${youtubeError.message || 'Unknown YouTube API error'}`,
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return new NextResponse(
      `Error uploading video: ${error.message || 'Unknown error'}`,
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}