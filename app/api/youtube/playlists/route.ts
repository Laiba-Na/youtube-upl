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

    // Get the user from the database (only id and email are needed)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    });

    if (!user) {
      console.log("User not found in database");
      return new NextResponse('User not found', { status: 404 });
    }
    
    // Get the first connected Google account for this user (you may adjust if multiple accounts should be handled differently)
    const googleAccount = await prisma.googleAccount.findFirst({
      where: { userId: user.id },
      select: { refreshToken: true }
    });

    if (!googleAccount) {
      console.log("Missing Google account");
      return new NextResponse('Google account not properly connected. Please reconnect your Google account.', { status: 400 });
    }

    // Initialize the OAuth2 client with the refresh token from the GoogleAccount
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/callback/google'
    );

    oauth2Client.setCredentials({
      refresh_token: googleAccount.refreshToken,
    });

    // Refresh the access token
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

    // Fetch the user's channel ID
    console.log("Fetching user's channel ID");
    const channelResponse = await youtube.channels.list({
      part: ['id'],
      mine: true
    });

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

    // Fetch playlists for the channel
    console.log("Fetching playlists for channel");
    const playlistsResponse = await youtube.playlists.list({
      part: ['snippet', 'id'],
      channelId: channelId,
      maxResults: 50
    } as youtube_v3.Params$Resource$Playlists$List);

    const playlists = playlistsResponse.data.items
      ? playlistsResponse.data.items.map(item => ({
          id: item.id || '',
          title: item.snippet?.title || 'Untitled Playlist'
        }))
      : [];

    console.log("Returning playlists:", playlists.length);
    return NextResponse.json({ playlists });
  } catch (error: any) {
    console.error('Playlists fetch error:', error);
    return new NextResponse(`Error fetching playlists: ${error.message || 'Unknown error'}`, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
