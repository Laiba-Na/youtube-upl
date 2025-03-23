import { NextResponse } from 'next/server';
import { google, youtube_v3 } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  console.log("Playlist API route called");
  
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    console.log("Session user:", session?.user?.email);
    
    if (!session?.user?.email) {
      console.log("No authenticated user found");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        googleRefreshToken: true,
        googleConnected: true
      }
    });

    console.log("User found:", !!user, "Google connected:", user?.googleConnected);

    if (!user) {
      console.log("User not found in database");
      return new NextResponse('User not found', { status: 404 });
    }
    
    if (!user.googleRefreshToken) {
      console.log("Missing Google refresh token");
      return new NextResponse('Google account not properly connected. Please reconnect your Google account.', { status: 400 });
    }

    console.log("Google refresh token is present");

    // Initialize the OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/callback/google'  // Make sure callback URL is correct
    );

    // Set credentials using the refresh token
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    // Get a new access token
    try {
      console.log("Refreshing access token");
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      console.log("Access token refreshed successfully");
    } catch (tokenError) {
      console.error("Error refreshing access token:", tokenError);
      return new NextResponse('Failed to authenticate with YouTube. Please reconnect your Google account.', { status: 401 });
    }

    // Initialize YouTube client
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    // Fetch user's playlists
    try {
      // Get the user's channel ID first
      console.log("Fetching user's channel ID");
      const channelResponse = await youtube.channels.list({
        part: ['id'],
        mine: true
      });

      console.log("Channel response items:", channelResponse.data.items?.length || 0);

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        console.log("No YouTube channel found");
        return new NextResponse('No YouTube channel found for this user', { status: 404 });
      }

      const channelId = channelResponse.data.items[0].id;
      
      if (!channelId) {
        console.log("Channel ID is undefined");
        return new NextResponse('Unable to determine channel ID', { status: 404 });
      }

      console.log("Channel ID:", channelId);

      // Now get the playlists for this channel with proper types
      console.log("Fetching playlists for channel");
      const playlistsResponse = await youtube.playlists.list({
        part: ['snippet', 'id'],
        channelId: channelId,
        maxResults: 50
      } as youtube_v3.Params$Resource$Playlists$List);

      console.log("Playlists response items:", playlistsResponse.data.items?.length || 0);

      // Extract relevant playlist information
      const playlists = playlistsResponse.data.items ? 
        playlistsResponse.data.items.map(item => ({
          id: item.id || '',
          title: item.snippet?.title || 'Untitled Playlist'
        })) : [];

      console.log("Returning playlists:", playlists.length);
      return NextResponse.json({
        playlists: playlists
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
        `Failed to fetch playlists: ${youtubeError.message || 'Unknown YouTube API error'}`,
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Playlists fetch error:', error);
    return new NextResponse(
      `Error fetching playlists: ${error.message || 'Unknown error'}`,
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}