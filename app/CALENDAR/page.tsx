
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import SocialCalendar from "@/components/SocialCalendar";
import { SocialPost } from "@prisma/client";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import emailjs from "@emailjs/browser";

export default function CalendarPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    content: "",
    platform: "",
    scheduledAt: "",
    mediaUrl: "",
    description: "",
    tags: "",
    privacyStatus: "private",
    imageUrl: "",
    title: "",
    hashtags: "",
  });
  const [backgroundStyle, setBackgroundStyle] = useState({});
  const [error, setError] = useState<string | null>(null);

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
        setPosts(data.filter((post: SocialPost) => post.scheduledAt));
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

  const handleButtonClick = () => {
    setBackgroundStyle({
      background:
        "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)",
      transition: "background 0.5s ease",
    });
    setTimeout(() => setBackgroundStyle({}), 1000);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError("No file selected");
      toast.error("No file selected");
      return;
    }

    if (!session?.user?.id) {
      setError("Please log in to upload a video");
      toast.error("Please log in to upload a video");
      return;
    }

    if (!session?.user?.googleAccounts?.[0]?.id) {
      setError("No Google account connected. Please connect a Google account.");
      toast.error("No Google account connected. Please connect a Google account.");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);
    formData.append("content", newPost.content);
    formData.append("scheduledAt", newPost.scheduledAt);
    formData.append("description", newPost.description);
    formData.append("tags", newPost.tags);
    formData.append("privacyStatus", newPost.privacyStatus);
    formData.append("googleAccountId", session.user.googleAccounts[0].id);

    console.log("Uploading video with form data:", {
      fileName: file.name,
      fileSize: file.size,
      content: newPost.content,
      scheduledAt: newPost.scheduledAt,
      googleAccountId: session.user.googleAccounts[0].id,
    });

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("Upload response:", data);
      if (!response.ok) {
        throw new Error(data.error || `Upload failed: ${response.statusText}`);
      }
      if (data.url) {
        setNewPost((prev) => ({ ...prev, mediaUrl: data.url }));
        toast.success("Video uploaded successfully!");
      } else if (data.message) {
        setNewPost((prev) => ({ ...prev, mediaUrl: "" }));
        toast.success(data.message);
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload video";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError("No file selected");
      toast.error("No file selected");
      return;
    }

    console.log("Selected file:", file);
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      toast.error("Please select a valid image file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    console.log("FormData entries:", Array.from(formData.entries()));

    try {
      const response = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Upload failed with status: ${response.status}`
        );
      }
      const data = await response.json();
      console.log("Upload response:", data);
      if (data.url) {
        setNewPost((prev) => ({
          ...prev,
          imageUrl: data.url,
          mediaUrl: data.url,
        }));
        toast.success("Image uploaded successfully!");
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload image";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!session?.user?.id || !session?.user?.email) {
      setError("Please log in to schedule a post");
      toast.error("Please log in to schedule a post");
      return;
    }

    if (newPost.platform.includes("YOUTUBE") && !session?.user?.googleAccounts?.[0]?.id) {
      setError("No Google account connected for YouTube. Please connect a Google account.");
      toast.error("No Google account connected for YouTube. Please connect a Google account.");
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

      const scheduledAtLocal = new Date(newPost.scheduledAt);
      if (isNaN(scheduledAtLocal.getTime())) {
        setError("Invalid date format for scheduled time");
        toast.error("Invalid date format");
        return;
      }

      const platforms = newPost.platform.split(",").filter((p) => p);
      const existingPosts = posts.filter(
        (post) =>
          platforms.some((p) => post.platform.includes(p)) &&
          post.content === newPost.content &&
          new Date(post.scheduledAt).getTime() === scheduledAtLocal.getTime()
      );

      if (existingPosts.length > 0) {
        setError(
          "A post with the same content and scheduled time already exists for one of the selected platforms."
        );
        toast.error("Post already exists for one of the platforms");
        return;
      }

      let postTableData = {
        userId: session.user.id,
        title: newPost.title || newPost.content,
        description: newPost.description,
        hashtags: newPost.hashtags,
        imageUrl: platforms.includes("YOUTUBE")
          ? newPost.mediaUrl
          : newPost.imageUrl,
        scheduledAt: scheduledAtLocal.toISOString().slice(0, -1),
        platforms: platforms.join(","),
      };

      // Save to Post table (only once)
      const postResponse = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postTableData),
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        throw new Error(
          errorData.error ||
            `Failed to create post in Post table (status: ${postResponse.status})`
        );
      }

      const postDataResult = await postResponse.json();

      for (const platform of platforms) {
        let postData: any = {
          content: newPost.content,
          platform,
          scheduledAt: scheduledAtLocal.toISOString().slice(0, -1),
          userId: session.user.id,
        };

        if (platform === "YOUTUBE") {
          if (!newPost.mediaUrl) {
            setError("Video is required for YouTube");
            toast.error("Video is required for YouTube");
            return;
          }
          postData.mediaUrl = newPost.mediaUrl;
          // Skip SocialPost creation for YouTube since /api/upload handles it
          continue;
        } else {
          if (!newPost.imageUrl) {
            setError("Image is required for other platforms");
            toast.error("Image is required for other platforms");
            return;
          }
          postData.mediaUrl = newPost.imageUrl;
        }

        // Save to SocialPost table (for non-YouTube platforms)
        const socialResponse = await fetch("/api/calendar/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        if (!socialResponse.ok) {
          const errorData = await socialResponse.json();
          throw new Error(
            errorData.error ||
              `Failed to create post for ${platform} (status: ${socialResponse.status})`
          );
        }

        const socialPostData = await socialResponse.json();
        const formattedPost: SocialPost = {
          id: socialPostData.id,
          content: socialPostData.content,
          platform: socialPostData.platform,
          scheduledAt: new Date(socialPostData.scheduledAt),
          mediaUrl: socialPostData.mediaUrl,
         
          userId: socialPostData.userId,
          status: socialPostData.status,
          projectId: socialPostData.projectId || null,
          createdAt: new Date(socialPostData.createdAt),
          updatedAt: new Date(socialPostData.updatedAt),
        };

        setPosts((prevPosts) => [...prevPosts, formattedPost]);
      }

      const userResponse = await fetch("/api/user/settings");
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user settings");
      }
      const userData = await userResponse.json();

      if (userData.emailNotifications) {
        const emailData = {
          to_email: session.user.email,
          name: session.user.name || "Friend",
          platforms: platforms.join(", "),
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

        const emailSendTime = scheduledAtLocal.getTime() - 60 * 60 * 1000;
        const currentTime = new Date().getTime();

        if (emailSendTime <= currentTime) {
          await sendEmail(emailData);
        } else {
          setTimeout(
            async () => await sendEmail(emailData),
            emailSendTime - currentTime
          );
        }
      }

      setNewPost({
        content: "",
        platform: "",
        scheduledAt: "",
        mediaUrl: "",
        description: "",
        tags: "",
        privacyStatus: "private",
        imageUrl: "",
        title: "",
        hashtags: "",
      });
      setIsAddPostOpen(false);
      toast.success("Posts scheduled successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create post";
      setError(errorMessage);
      toast.error(errorMessage);
    }
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

      <Transition appear show={isAddPostOpen} as="div">
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsAddPostOpen(false)}
        >
          <Transition.Child
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
                          setNewPost((prev) => ({
                            ...prev,
                            content: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                        rows={4}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Title
                      </label>
                      <input
                        id="title"
                        type="text"
                        value={newPost.title}
                        onChange={(e) =>
                          setNewPost((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={newPost.description}
                        onChange={(e) =>
                          setNewPost((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="hashtags"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Hashtags (comma-separated)
                      </label>
                      <input
                        id="hashtags"
                        type="text"
                        value={newPost.hashtags}
                        onChange={(e) =>
                          setNewPost((prev) => ({
                            ...prev,
                            hashtags: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
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
                          setNewPost((prev) => ({
                            ...prev,
                            scheduledAt: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                        required
                      />
                    </div>
                    {newPost.platform.includes("YOUTUBE") && (
                      <>
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
                              setNewPost((prev) => ({
                                ...prev,
                                tags: e.target.value,
                              }))
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
                            Privacy Status
                          </label>
                          <select
                            id="privacyStatus"
                            value={newPost.privacyStatus}
                            onChange={(e) =>
                              setNewPost((prev) => ({
                                ...prev,
                                privacyStatus: e.target.value,
                              }))
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                          >
                            <option value="private">Private</option>
                            <option value="unlisted">Unlisted</option>
                            <option value="public">Public</option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="mediaUrl"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Video Upload
                          </label>
                          <input
                            id="mediaUrl"
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                          />
                        </div>
                      </>
                    )}
                    {newPost.platform
                      .split(",")
                      .some((p) =>
                        ["INSTAGRAM", "LINKEDIN", "FACEBOOK"].includes(p)
                      ) && (
                      <div>
                        <label
                          htmlFor="imageUrl"
                          className="block mb-1 text-sm font-medium text-gray-700"
                        >
                          Image Upload
                        </label>
                        <input
                          id="imageUrl"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                      </div>
                    )}
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition duration-300"
                      >
                        Schedule Post
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddPostOpen(false)}
                        className="inline-flex justify-center rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400 transition duration-300"
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
