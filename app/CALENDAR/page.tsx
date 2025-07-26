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
    platform: "", // Stored as comma-separated string
    scheduledAt: "",
    mediaUrl: "",
    description: "", // For YouTube
    tags: "", // For YouTube
    privacyStatus: "private", // For YouTube
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
    const intervalId = setInterval(fetchPosts, 30 * 1000); // Refresh every 30 seconds
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

  // Handle video upload for YouTube
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);
    formData.append("content", newPost.content);
    formData.append("scheduledAt", newPost.scheduledAt);
    formData.append("description", newPost.description);
    formData.append("tags", newPost.tags);
    formData.append("privacyStatus", newPost.privacyStatus);
    formData.append(
      "googleAccountId",
      session?.user?.googleAccounts?.[0]?.id || ""
    );

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }
      const data = await response.json();
      if (data.url) {
        setNewPost((prev) => ({ ...prev, mediaUrl: data.url }));
        toast.success("Video uploaded to Cloudinary!");
      } else if (data.message) {
        setNewPost((prev) => ({ ...prev, mediaUrl: "" }));
        toast.success(data.message);
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      setError(
        `Failed to upload video: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      toast.error(
        `Failed to upload video: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Handle image upload for non-YouTube platforms
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload image");
      const { url } = await res.json();
      setNewPost((prev) => ({ ...prev, mediaUrl: url }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      setError(
        `Failed to upload image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      toast.error(
        `Failed to upload image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
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

    // Validation
    if (!newPost.content || !newPost.scheduledAt || !newPost.platform) {
      setError(
        "Please fill all required fields (content, platform, scheduled date)"
      );
      toast.error("Please fill all required fields");
      return;
    }

    const scheduledAtLocal = new Date(newPost.scheduledAt);
    if (isNaN(scheduledAtLocal.getTime())) {
      setError("Invalid date format for scheduled time");
      toast.error("Invalid date format");
      return;
    }

    // YouTube specific validation
    if (newPost.platform.includes("YOUTUBE")) {
      if (!newPost.mediaUrl || !newPost.description) {
        setError("For YouTube, content, description, and video are required");
        toast.error(
          "For YouTube, content, description, and video are required"
        );
        return;
      }
    }

    const existingPost = posts.find(
      (post) =>
        post.content === newPost.content &&
        new Date(post.scheduledAt).getTime() === scheduledAtLocal.getTime() &&
        post.platform.split(",").some((p) => newPost.platform.includes(p))
    );

    if (existingPost) {
      setError(
        "A post with the same content and scheduled time already exists for one of the selected platforms."
      );
      toast.error("Post already exists for one of the platforms");
      return;
    }

    const postData = {
      content: newPost.content,
      platform: newPost.platform,
      scheduledAt: scheduledAtLocal.toISOString().slice(0, -1),
      mediaUrl: newPost.mediaUrl || null,
      userId: session.user.id,
    };

    const response = await fetch("/api/calendar/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Failed to create post (status: ${response.status})`
      );
    }

    const newPostData = await response.json();

    const userResponse = await fetch("/api/user/settings");
    if (!userResponse.ok) {
      throw new Error("Failed to fetch user settings");
    }
    const userData = await userResponse.json();

    if (userData.emailNotifications) {
      const emailData = {
        to_email: session.user.email,
        name: session.user.name || "Friend",
        platform: newPost.platform,
        scheduledAt: scheduledAtLocal.toLocaleString("en-US", {
          timeZone: "Asia/Karachi",
          hour12: true,
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
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
    }

    if (newPost.platform.includes("YOUTUBE") && newPost.mediaUrl) {
      const uploadTime = scheduledAtLocal.getTime() - new Date().getTime();
      if (uploadTime > 0) {
        console.log("YouTube upload scheduled via API/upload");
      } else {
        await uploadToYouTube(newPostData); // Immediate upload if past scheduled time
      }
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
      platform: "",
      scheduledAt: "",
      mediaUrl: "",
      description: "",
      tags: "",
      privacyStatus: "private",
    });
    setIsAddPostOpen(false);
    toast.success("Post scheduled successfully!");
  };

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
      toast.success("Notification email sent!");
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  };

  const uploadToYouTube = async (postData: {
    id: string;
    content: string;
    mediaUrl: string | null;
  }) => {
    const { id, content, mediaUrl } = postData;

    if (!mediaUrl) {
      console.error(`No media URL provided for post ID ${id}`);
      throw new Error("Media URL is required for YouTube upload");
    }

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
      console.log(
        `Initiating YouTube upload for post ID ${id}, mediaUrl: ${mediaUrl} at ${new Date().toLocaleString(
          "en-US",
          { timeZone: "Asia/Karachi" }
        )}`
      );

      const initResponse = await fetch(
        `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.YOUTUBE_API_KEY}`,
            "Content-Type": "application/json",
            "X-Upload-Content-Type": "video/*",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(
          `Failed to initiate upload: ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }

      const location = initResponse.headers.get("Location");
      if (!location) {
        throw new Error("No upload location received");
      }

      const mediaResponse = await fetch(mediaUrl, {
        method: "GET",
        mode: "cors",
      });
      if (!mediaResponse.ok) {
        throw new Error(`Failed to fetch media: ${mediaResponse.statusText}`);
      }

      const videoBlob = await mediaResponse.blob();

      const uploadResult = await fetch(location, {
        method: "PUT",
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": videoBlob.size.toString(),
        },
        body: videoBlob,
      });

      if (!uploadResult.ok) {
        const errorData = await uploadResult.json();
        throw new Error(
          `Failed to upload video: ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }

      const updateResponse = await fetch(`/api/calendar/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "POSTED" }),
      });
      if (!updateResponse.ok) {
        console.warn("Failed to update post status, but upload succeeded");
      }

      toast.success("Video uploaded to YouTube!");
    } catch (error) {
      console.error(`YouTube upload error for post ID ${id}:`, error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload to YouTube"
      );
      throw error;
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
                      <label className="block text-sm font-medium text-gray-700">
                        Platforms (Select Multiple)
                      </label>
                      <div className="mt-2 space-y-2">
                        {["YOUTUBE", "INSTAGRAM", "LINKEDIN", "FACEBOOK"].map(
                          (platform) => (
                            <div key={platform} className="flex items-center">
                              <input
                                type="checkbox"
                                id={platform}
                                value={platform}
                                checked={newPost.platform
                                  .split(",")
                                  .includes(platform)}
                                onChange={(e) => {
                                  const platforms = newPost.platform
                                    .split(",")
                                    .filter((p) => p);
                                  if (e.target.checked) {
                                    platforms.push(platform);
                                  } else {
                                    const index = platforms.indexOf(platform);
                                    if (index > -1) platforms.splice(index, 1);
                                  }
                                  setNewPost((prev) => ({
                                    ...prev,
                                    platform: platforms.join(","),
                                  }));
                                }}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={platform}
                                className="ml-2 text-sm text-gray-700"
                              >
                                {platform}
                              </label>
                            </div>
                          )
                        )}
                      </div>
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
                    {newPost.platform.includes("YOUTUBE") && (
                      <>
                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Description <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="description"
                            value={newPost.description}
                            onChange={(e) =>
                              setNewPost({
                                ...newPost,
                                description: e.target.value,
                              })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                            rows={4}
                            required={newPost.platform.includes("YOUTUBE")}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="tags"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Tags (comma separated)
                          </label>
                          <input
                            id="tags"
                            type="text"
                            value={newPost.tags}
                            onChange={(e) =>
                              setNewPost({ ...newPost, tags: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                            placeholder="tag1, tag2, tag3"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="privacyStatus"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Privacy Status{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="privacyStatus"
                            value={newPost.privacyStatus}
                            onChange={(e) =>
                              setNewPost({
                                ...newPost,
                                privacyStatus: e.target.value,
                              })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                            required={newPost.platform.includes("YOUTUBE")}
                          >
                            <option value="private">Private</option>
                            <option value="unlisted">Unlisted</option>
                            <option value="public">Public</option>
                          </select>
                        </div>
                      </>
                    )}
                    <div>
                      <label
                        htmlFor="mediaUrl"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Media URL (required for YouTube)
                      </label>
                      <input
                        id="mediaUrl"
                        type="text"
                        value={newPost.mediaUrl}
                        onChange={(e) =>
                          setNewPost({ ...newPost, mediaUrl: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                        placeholder="https://res.cloudinary.com/demo/video/upload/v1616112898/car-driving.mp4"
                        readOnly
                      />
                      {newPost.platform.includes("YOUTUBE") ? (
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoUpload}
                          className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                      ) : (
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={handleImageUpload}
                          className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                      )}
                    </div>
                    {!newPost.platform.includes("YOUTUBE") && (
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
                    )}
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
