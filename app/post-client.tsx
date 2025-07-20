"use client";

import { useEffect } from "react";
import { sendEmail } from "@/lib/emailjs-client";

export default function PostClient() {
  useEffect(() => {
    const handlePost = async () => {
      try {
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postTitle: "My Post",
            content: "Test content",
            platform: "YOUTUBE",
            scheduledAt: "2025-07-16T18:45:00.000Z",
            mediaUrl: "path/to/test.mp4",
          }),
        });
        const data = await response.json();
        if (data.action === "sendEmail") {
          const sent = await sendEmail(data.email, data.subject, data.message);
          console.log("Post confirmation email result:", sent);
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Post client error:", errorMessage);
      }
    };
    handlePost();
  }, []);

  return <div>Creating post...</div>;
}
