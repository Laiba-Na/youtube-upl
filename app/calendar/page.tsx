"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import SocialCalendar from "@/components/SocialCalendar";
import { SocialPost } from "@prisma/client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import emailjs from "emailjs-com";
import toast from "react-hot-toast";

export default function CalendarPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    content: "",
    platform: "Instagram",
    scheduledAt: "",
    mediaUrl: "",
  });
  const [backgroundStyle, setBackgroundStyle] = useState({});
  const [error, setError] = useState<string | null>(null);

  // Fetch posts on mount and periodically
  useEffect(() => {
    async function fetchPosts() {
      if (!session?.user?.id) {
        console.log("No user session, skipping fetchPosts");
        return;
      }
      try {
        const response = await fetch("/api/calendar/posts");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Failed to fetch posts: ${response.statusText}`
          );
        }
        const data = await response.json();
        console.log("Fetched posts:", data);
        setPosts(data);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Failed to load posts. Please try again.");
        setPosts([]);
      }
    }

    fetchPosts();
    const intervalId = setInterval(fetchPosts, 30 * 1000);
    return () => clearInterval(intervalId);
  }, [session]);

  // Handle button click for background effect
  const handleButtonClick = () => {
    setBackgroundStyle({
      background:
        "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)",
      transition: "background 0.5s ease",
    });
    setTimeout(() => setBackgroundStyle({}), 1000);
  };

  // Handle form submission for new post
  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!session?.user?.id || !session?.user?.email) {
      setError("Please log in to schedule a post");
      toast.error("Please log in to schedule a post");
      return;
    }

    try {
      if (!newPost.content || !newPost.scheduledAt || !newPost.platform) {
        setError(
          "Please fill all required fields (content, platform, scheduled date)"
        );
        toast.error("Please fill all required fields");
        return;
      }

      // Parse the scheduledAt date as local time
      const scheduledAtLocal = new Date(newPost.scheduledAt);
      if (isNaN(scheduledAtLocal.getTime())) {
        setError("Invalid date format for scheduled time");
        toast.error("Invalid date format");
        return;
      }

      // Convert local time to UTC for database storage
      const scheduledAtUTC = new Date(
        scheduledAtLocal.getTime() +
          scheduledAtLocal.getTimezoneOffset() * 60000
      );

      // Check if the post already exists in the local state
      const existingPost = posts.find(
        (post) =>
          post.content === newPost.content &&
          new Date(post.scheduledAt).getTime() === scheduledAtUTC.getTime()
      );

      if (existingPost) {
        setError(
          "A post with the same content and scheduled time already exists."
        );
        toast.error("Post already exists");
        return;
      }

      const postData = {
        content: newPost.content,
        platform: newPost.platform,
        scheduledAt: scheduledAtUTC.toISOString(),
        mediaUrl: newPost.mediaUrl || null,
        userId: session.user.id,
      };

      console.log("Sending POST request with data:", postData);

      const response = await fetch("/api/calendar/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(
          errorData.error ||
            `Failed to create post (status: ${response.status})`
        );
      }

      const newPostData = await response.json();
      console.log("API response:", newPostData);

      // Fetch user settings to check emailNotifications
      const userResponse = await fetch("/api/user/settings");
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user settings");
      }
      const userData = await userResponse.json();

      // Schedule email notification 1 hour before if emailNotifications is true
      if (userData.emailNotifications) {
        const emailData = {
          to_email: session.user.email,
          platform: newPost.platform,
          scheduledAt: scheduledAtLocal.toLocaleString(),
          content: newPost.content,
        };

        const emailSendTime = scheduledAtLocal.getTime() - 60 * 60 * 1000; // 1 hour before
        const currentTime = new Date().getTime();

        if (emailSendTime <= currentTime) {
          await sendEmail(emailData);
        } else {
          setTimeout(async () => {
            await sendEmail(emailData);
          }, emailSendTime - currentTime);
        }
        console.log("Email scheduled successfully for:", session.user.email);
      } else {
        console.log(
          "Email notifications disabled for user:",
          session.user.email
        );
      }

      // If the platform is YouTube, schedule the post to be uploaded
      if (newPost.platform === "YouTube") {
        const uploadTime = scheduledAtLocal.getTime() - new Date().getTime();
        setTimeout(async () => {
          await uploadToYouTube(newPostData);
        }, uploadTime);
      }

      const formattedPost: SocialPost = {
        id: newPostData.id,
        content: newPostData.content,
        platform: newPostData.platform,
        scheduledAt: new Date(newPostData.scheduledAt),
        mediaUrl: newPostData.mediaUrl,
        userId: newPostData.userId,
        status: newPostData.status,
        projectId: newPostData.projectId || null,
        createdAt: new Date(newPostData.createdAt),
        updatedAt: new Date(newPostData.updatedAt),
      };

      setPosts((prevPosts) => [...prevPosts, formattedPost]);
      setNewPost({
        content: "",
        platform: "Instagram",
        scheduledAt: "",
        mediaUrl: "",
      });
      setIsAddPostOpen(false);
      toast.success("Post scheduled successfully!");
      console.log("Post created successfully:", formattedPost);
    } catch (error) {
      console.error("Error creating post:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create post"
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to create post"
      );
    }
  };

  // Function to send email using EmailJS
  const sendEmail = async (emailData: Record<string, unknown>) => {
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      throw new Error("EmailJS configuration is missing.");
    }

    try {
      await emailjs.send(serviceId, templateId, emailData, publicKey);
      console.log("Email sent successfully to:", emailData.to_email);
      toast.success("Notification email scheduled!");
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  };

  // Function to upload video to YouTube
  const uploadToYouTube = async (postData: { content: any; mediaUrl: any }) => {
    const { content, mediaUrl } = postData;

    const requestBody = {
      snippet: {
        title: content,
        description: content,
        tags: ["tag1", "tag2"],
        categoryId: "22",
      },
      status: {
        privacyStatus: "public",
      },
    };

    try {
      const response = await fetch(
        `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=media&key=${process.env.YOUTUBE_API_KEY}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.YOUTUBE_ACCESS_TOKEN}`, // TODO: Replace with actual access token
            "Content-Type": "video/*",
          },
          body: mediaUrl,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("YouTube API error response:", errorData);
        throw new Error(
          `Failed to upload video to YouTube: ${errorData.error.message}`
        );
      }

      const uploadResponse = await response.json();
      console.log("Video uploaded successfully:", uploadResponse);
    } catch (error) {
      console.error("Error uploading to YouTube:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to upload to YouTube"
      );
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-r from-purple-500 to-blue-500 p-6"
      style={backgroundStyle}
    >
      <h1 className="text-4xl font-extrabold text-white mb-6 text-center">
        Social Media Calendar
      </h1>
      <button
        onClick={() => setIsAddPostOpen(true)}
        className="mb-6 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
      >
        Add Post
      </button>
      {error && (
        <div className="mb-4 text-red-500 text-sm font-medium text-center">
          {error}
        </div>
      )}
      <SocialCalendar posts={posts} onButtonClick={handleButtonClick} />

      <Transition appear show={isAddPostOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsAddPostOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold text-gray-900"
                  >
                    Create New Post
                  </Dialog.Title>
                  <form onSubmit={handleAddPost} className="mt-4 space-y-4">
                    <div>
                      <label
                        htmlFor="platform"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Platform
                      </label>
                      <select
                        id="platform"
                        value={newPost.platform}
                        onChange={(e) =>
                          setNewPost({ ...newPost, platform: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                        required
                      >
                        <option value="" disabled>
                          Select a platform
                        </option>
                        <option>Instagram</option>
                        <option>Twitter</option>
                        <option>Facebook</option>
                        <option>LinkedIn</option>
                        <option>YouTube</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="content"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Content
                      </label>
                      <textarea
                        id="content"
                        value={newPost.content}
                        onChange={(e) =>
                          setNewPost({ ...newPost, content: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                        rows={4}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="scheduledAt"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Scheduled Date & Time
                      </label>
                      <input
                        id="scheduledAt"
                        type="datetime-local"
                        value={newPost.scheduledAt}
                        onChange={(e) =>
                          setNewPost({
                            ...newPost,
                            scheduledAt: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="mediaUrl"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Media URL (optional)
                      </label>
                      <input
                        id="mediaUrl"
                        type="text"
                        value={newPost.mediaUrl}
                        onChange={(e) =>
                          setNewPost({ ...newPost, mediaUrl: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                        placeholder="https://example.com/video.mp4"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition duration-300"
                      >
                        Schedule Post
                      </button>
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400 transition duration-300"
                        onClick={() => setIsAddPostOpen(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
