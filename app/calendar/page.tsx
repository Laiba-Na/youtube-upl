import SocialCalendar from "@/components/SocialCalendar";
import { useState, useEffect } from "react";

export default function CalendarPage() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/posts", {
          credentials: "include", // Ensure cookies/session are sent
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch posts: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log("Fetched posts:", data);
        setPosts(data.posts || []);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Fetch posts error:", errorMessage);
      }
    };
    fetchPosts();
  }, []);

  return <SocialCalendar posts={posts} />;
}