// app/api/facebook/insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get facebookAccountId from query params
    const facebookAccountId = request.nextUrl.searchParams.get("facebookAccountId");
    
    if (!facebookAccountId) {
      return NextResponse.json(
        { message: "Facebook account ID is required" },
        { status: 400 }
      );
    }
    
    // Get Facebook account details
    const facebookAccount = await prisma.facebookAccount.findUnique({
      where: { id: facebookAccountId },
    });
    
    if (!facebookAccount) {
      return NextResponse.json(
        { message: "Facebook account not found" },
        { status: 404 }
      );
    }
    
    // Check if this Facebook account belongs to the authenticated user
    if (facebookAccount.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized: Account does not belong to user" },
        { status: 403 }
      );
    }
    
    // Check if page is connected
    if (!facebookAccount.pageId) {
      return NextResponse.json(
        { message: "No Facebook page connected to this account" },
        { status: 400 }
      );
    }
    
    // Define the metrics to fetch
    const metrics = [
      "page_impressions",
      "page_impressions_unique",
      "page_lifetime_engaged_followers_unique",
      "page_post_engagements",
      "page_follows",
    ];
    
    // Fetch page insights from Facebook Graph API
    const period = "day"; // Options: day, week, days_28
    const datePreset = "last_30d"; // Options: today, yesterday, last_7_days, last_30_days
    
    const insightsResponse = await fetch(
      `https://graph.facebook.com/v19.0/${facebookAccount.pageId}/insights?metric=${metrics.join(",")}&period=${period}&date_preset=${datePreset}&access_token=${facebookAccount.accessToken}`
    );
    
    if (!insightsResponse.ok) {
      const error = await insightsResponse.json();
      console.error("Facebook API error:", error);
      return NextResponse.json(
        { message: `Error from Facebook API: ${error.error?.message || "Unknown error"}` },
        { status: insightsResponse.status }
      );
    }
    
    const insightsData = await insightsResponse.json();
    
    // Fetch page posts
    const postsResponse = await fetch(
      `https://graph.facebook.com/v19.0/${facebookAccount.pageId}/posts?fields=id,message,created_time,insights.metric(post_impressions,post_impressions_unique,post_reactions_by_type_total)&limit=5&access_token=${facebookAccount.accessToken}`
    );
    
    let postsData = { data: [] };
    
    if (postsResponse.ok) {
      postsData = await postsResponse.json();
    }
    
    // Return the combined data
    return NextResponse.json({
      pageId: facebookAccount.pageId,
      pageName: facebookAccount.pageName,
      insights: insightsData.data,
      posts: postsData.data,
    });
  } catch (error) {
    console.error("Error fetching Facebook insights:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}