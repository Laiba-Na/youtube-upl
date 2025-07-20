import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { prisma } from "@/lib/prisma"; // Ensure this path works (try '../../lib/prisma' if needed)
import { UserAnalytics } from "@prisma/client"; // Import the UserAnalytics type

// Initialize Twitter client with Bearer Token
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN || "");

export async function GET() {
  try {
    if (!process.env.TWITTER_BEARER_TOKEN) {
      return NextResponse.json(
        { error: "Twitter Bearer Token is missing" },
        { status: 500 }
      );
    }
    console.log("TWITTER_BEARER_TOKEN loaded");

    // Fetch your own user data
    const user = await twitterClient.v2.me({
      "user.fields": "public_metrics,username",
    });
    const userId = user.data.id;
    const username = user.data.username;
    console.log("Fetched User ID:", userId, "Username:", username);

    // Fetch recent tweets and their metrics
    const tweets = await twitterClient.v2.userTimeline(userId, {
      "tweet.fields": "public_metrics,created_at",
      max_results: 10,
    });
    const tweetData = tweets.data.data;

    // Store user analytics
    await prisma.userAnalytics.upsert({
      where: { userId: userId },
      update: {
        username: username,
        followers: user.data.public_metrics?.followers_count || 0,
        following: user.data.public_metrics?.following_count || 0,
        updatedAt: new Date(),
      },
      create: {
        userId: userId,
        username: username,
        followers: user.data.public_metrics?.followers_count || 0,
        following: user.data.public_metrics?.following_count || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Store tweet analytics
    for (const tweet of tweetData) {
      await prisma.tweetAnalytics.upsert({
        where: { tweetId: tweet.id },
        update: {
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          impressions: tweet.public_metrics?.impression_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
          updatedAt: new Date(),
        },
        create: {
          tweetId: tweet.id,
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          impressions: tweet.public_metrics?.impression_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Fetch profile visits with explicit typing
    const userAnalytics = (await prisma.userAnalytics.findUnique({
      where: { userId: userId },
      select: { profileVisits: true },
    })) as UserAnalytics | null;
    const profileVisits = userAnalytics?.profileVisits || 0;

    return NextResponse.json({
      message: "Analytics fetched and stored successfully",
      userId,
      username,
      followers: user.data.public_metrics?.followers_count || 0,
      following: user.data.public_metrics?.following_count || 0,
      tweetMetrics: tweetData.map((tweet) => ({
        tweetId: tweet.id,
        text: tweet.text,
        impressions: tweet.public_metrics?.impression_count || 0,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
        createdAt: tweet.created_at,
      })),
      profileVisits,
    });
  } catch (error) {
    console.error("Twitter analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
