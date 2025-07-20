"use client";

import { useEffect, useState } from "react";
import { sendEmail } from "@/lib/emailjs-client";

export default function TestPage() {
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [postStatus, setPostStatus] = useState<string | null>(null);

  // Test email
  useEffect(() => {
    const triggerEmail = async () => {
      try {
        const response = await fetch("/api/test-email");
        if (!response.ok) {
          throw new Error(`Fetch failed: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.action === "sendEmail") {
          const sent = await sendEmail(
            data.email,
            data.subject,
            data.message,
            "Test Post",
            "N/A"
          );
          setEmailStatus(
            sent ? "Email sent successfully" : "Email failed to send"
          );
        } else {
          setEmailStatus("Unexpected API response");
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Test email fetch error:", errorMessage);
        setEmailStatus(`Error: ${errorMessage}`);
      }
    };
    triggerEmail();
  }, []);

  // Test post
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
            scheduledAt: "2025-07-16T19:30:00.000Z",
            mediaUrl: "path/to/test.mp4",
          }),
        });
        if (!response.ok) {
          throw new Error(`Fetch failed: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.action === "sendEmail") {
          const sent = await sendEmail(
            data.email,
            data.subject,
            data.message,
            data.postTitle,
            data.scheduledAt
          );
          setPostStatus(
            sent ? "Post created and email sent" : "Post email failed"
          );
        } else {
          setPostStatus("Unexpected API response");
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Post client error:", errorMessage);
        setPostStatus(`Error: ${errorMessage}`);
      }
    };
    handlePost();
  }, []);

  return (
    <div>
      <h1>Test Email and Post</h1>
      <p>Email Status: {emailStatus || "Loading..."}</p>
      <p>Post Status: {postStatus || "Loading..."}</p>
    </div>
  );
}
