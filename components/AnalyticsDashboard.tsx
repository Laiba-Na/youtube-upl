"use client";
import { useEffect, useState } from "react";

interface UserAnalytics {
  userId: string;
  username: string;
  followers: number;
  following: number;
  profileVisits: number;
}

interface TweetAnalytics {
  tweetId: string;
  text: string;
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  createdAt: string;
}

export default function AnalyticsDashboard() {
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(
    null
  );
  const [tweetAnalytics, setTweetAnalytics] = useState<TweetAnalytics[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        console.log("Fetching analytics...");
        const response = await fetch("/api/twitter-analytics");
        console.log("Response status:", response.status);
        if (!response.ok)
          throw new Error(`Fetch failed with status ${response.status}`);
        const data = await response.json();
        console.log("Data:", data);
        setUserAnalytics({
          userId: data.userId,
          username: data.username,
          followers: data.followers,
          following: data.following,
          profileVisits: data.profileVisits,
        });
        setTweetAnalytics(data.tweetMetrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Fetch error:", err);
      }
    };
    fetchAnalytics();
  }, []);

  if (error)
    return (
      <div className="container mx-auto p-4 text-red-500">Error: {error}</div>
    );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Twitter Analytics Dashboard</h1>
      {userAnalytics ? (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg text-white">
          <h2 className="text-xl font-semibold">User Analytics</h2>
          <p>Username: {userAnalytics.username}</p>
          <p>Followers: {userAnalytics.followers}</p>
          <p>Following: {userAnalytics.following}</p>
          <p>Profile Visits: {userAnalytics.profileVisits}</p>
        </div>
      ) : (
        <p className="mb-6">Loading user analytics...</p>
      )}
      <h2 className="text-xl font-semibold mb-2">Recent Tweets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tweetAnalytics.length > 0 ? (
          tweetAnalytics.map((tweet) => (
            <div
              key={tweet.tweetId}
              className="p-4 bg-gray-800 rounded-lg text-white"
            >
              <p>
                Tweet: {tweet.text.substring(0, 50)}
                {tweet.text.length > 50 ? "..." : ""}
              </p>
              <p>Impressions: {tweet.impressions}</p>
              <p>Likes: {tweet.likes}</p>
              <p>Retweets: {tweet.retweets}</p>
              <p>Replies: {tweet.replies}</p>
              <p>Date: {new Date(tweet.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        ) : (
          <p>No tweet analytics available.</p>
        )}
      </div>
    </div>
  );
}
