// app/api/youtube/analytics/route.ts

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { youtube_v3 } from 'googleapis';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  console.log("YouTube Analytics API route called");
  
  try {
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');
    const startDate = url.searchParams.get('startDate') || getDateXDaysAgo(30);
    const endDate = url.searchParams.get('endDate') || getTodayDate();
    
    if (!accountId) {
      return new NextResponse('Missing accountId parameter', { status: 400 });
    }
    
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("No authenticated user found");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the Google account with this ID
    const googleAccount = await prisma.googleAccount.findFirst({
      where: { 
        id: accountId,
        userId: session.user.id // Ensure the account belongs to this user
      },
      select: { refreshToken: true, googleEmail: true }
    });

    if (!googleAccount) {
      console.log("Google account not found");
      return new NextResponse('Google account not found', { status: 404 });
    }

    // Initialize the OAuth2 client
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

    // Get channel information
    const channelResponse = await youtube.channels.list({
      part: ['id', 'snippet', 'statistics', 'contentDetails'],
      mine: true
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      console.log("No YouTube channel found");
      return new NextResponse('No YouTube channel found for this user', { status: 404 });
    }

    const channelData = channelResponse.data.items[0];
    const channelId = channelData.id;
    
    // Initialize YouTube Analytics client
    const youtubeAnalytics = google.youtubeAnalytics({
      version: 'v2',
      auth: oauth2Client,
    });

    // Get analytics data
    const analyticsResponse = await youtubeAnalytics.reports.query({
      ids: `channel==${channelId}`,
      startDate: startDate,
      endDate: endDate,
      metrics: 'views,comments,likes,dislikes,estimatedMinutesWatched,averageViewDuration',
      dimensions: 'day',
      sort: 'day'
    });

    // Get top videos
    const topVideosResponse = await youtubeAnalytics.reports.query({
      ids: `channel==${channelId}`,
      startDate: startDate,
      endDate: endDate,
      metrics: 'views,estimatedMinutesWatched,likes,comments',
      dimensions: 'video',
      sort: '-views',
      maxResults: 10
    });

    // Get video IDs from top videos
    let videoIds: string[] = [];
    if (topVideosResponse.data.rows) {
      videoIds = topVideosResponse.data.rows.map(row => row[0].toString());
    }

    // Get video details
    let videoDetails: youtube_v3.Schema$Video[] = [];
    if (videoIds.length > 0) {
      const videosResponse = await youtube.videos.list({
        part: ['snippet', 'contentDetails'],
        id: videoIds
      });
      
      if (videosResponse.data.items) {
        videoDetails = videosResponse.data.items;
      }
    }

    // Get demographics data
    const demographicsResponse = await youtubeAnalytics.reports.query({
      ids: `channel==${channelId}`,
      startDate: startDate,
      endDate: endDate,
      metrics: 'viewerPercentage',
      dimensions: 'ageGroup,gender',
      sort: 'gender,ageGroup'
    }).catch(err => {
      console.log("Demographics data not available:", err.message);
      return { data: { rows: [] } };
    });

    // Get traffic source data
    const trafficSourceResponse = await youtubeAnalytics.reports.query({
      ids: `channel==${channelId}`,
      startDate: startDate,
      endDate: endDate,
      metrics: 'views',
      dimensions: 'insightTrafficSourceType',
      sort: '-views'
    });

    return NextResponse.json({
      channelInfo: {
        title: channelData.snippet?.title || 'Unknown Channel',
        description: channelData.snippet?.description || '',
        customUrl: channelData.snippet?.customUrl || '',
        thumbnails: channelData.snippet?.thumbnails || {},
        publishedAt: channelData.snippet?.publishedAt || '',
        statistics: channelData.statistics || {},
      },
      timeSeriesData: analyticsResponse.data,
      topVideos: {
        headers: topVideosResponse.data.columnHeaders || [],
        rows: topVideosResponse.data.rows || [],
        videoDetails: videoDetails
      },
      demographics: demographicsResponse.data,
      trafficSources: trafficSourceResponse.data,
      dateRange: {
        startDate,
        endDate
      }
    });
  } catch (error: any) {
    console.error('YouTube Analytics fetch error:', error);
    return new NextResponse(`Error fetching YouTube analytics: ${error.message || 'Unknown error'}`, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions for date formatting
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getDateXDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}