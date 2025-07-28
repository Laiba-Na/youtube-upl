'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '@/app/DarkModeContext';
import SocialCalendar from '@/components/SocialCalendar';
import { SocialPost } from '@prisma/client';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/sideBar';
import { Menu } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface NewPost {
  content: string;
  platform: string;
  scheduledAt: string;
  mediaUrl: string;
  description: string;
  tags: string;
  privacyStatus: 'public' | 'private' | 'unlisted';
  imageUrl: string;
  title: string;
  hashtags: string;
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const { darkMode } = useDarkMode();
  const router = useRouter();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [newPost, setNewPost] = useState<NewPost>({
    content: '',
    platform: '',
    scheduledAt: '',
    mediaUrl: '',
    description: '',
    tags: '',
    privacyStatus: 'private',
    imageUrl: '',
    title: '',
    hashtags: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    async function fetchPosts() {
      if (!session?.user?.id) {
        console.log('No user session, skipping fetchPosts');
        return;
      }
      try {
        const response = await fetch('/api/calendar/posts');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch posts: ${response.statusText}`);
        }
        const data: SocialPost[] = await response.json();
        console.log('Fetched posts:', data);
        setPosts(data.filter((post) => post.scheduledAt));
      } catch (err: unknown) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again.');
        setPosts([]);
      }
    }

    fetchPosts();
    const intervalId = setInterval(fetchPosts, 5 * 60 * 1000); // Poll every 5 minutes
    return () => clearInterval(intervalId);
  }, [session]);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError('No file selected');
      toast.error('No file selected');
      return;
    }

    if (!session?.user?.id) {
      setError('Please log in to upload a video');
      toast.error('Please log in to upload a video');
      return;
    }

    if (!session?.user?.googleAccounts?.[0]?.id) {
      setError('No Google account connected. Please connect a Google account.');
      toast.error('No Google account connected. Please connect a Google account.');
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('content', newPost.content);
    formData.append('scheduledAt', newPost.scheduledAt);
    formData.append('description', newPost.description);
    formData.append('tags', newPost.tags);
    formData.append('privacyStatus', newPost.privacyStatus);
    formData.append('googleAccountId', session.user.googleAccounts[0].id);

    console.log('Uploading video with form data:', {
      fileName: file.name,
      fileSize: file.size,
      content: newPost.content,
      scheduledAt: newPost.scheduledAt,
      googleAccountId: session.user.googleAccounts[0].id,
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      console.log('Upload response:', data);
      if (!response.ok) {
        throw new Error(data.error || `Upload failed: ${response.statusText}`);
      }
      if (data.url) {
        setNewPost((prev) => ({ ...prev, mediaUrl: data.url }));
        toast.success('Video uploaded successfully!');
      } else if (data.message) {
        setNewPost((prev) => ({ ...prev, mediaUrl: '' }));
        toast.success(data.message);
      }
    } catch (error: unknown) {
      console.error('Error uploading video:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload video';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError('No file selected');
      toast.error('No file selected');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      toast.error('Please select a valid image file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Upload response:', data);
      if (data.url) {
        setNewPost((prev) => ({
          ...prev,
          imageUrl: data.url,
          mediaUrl: data.url,
        }));
        toast.success('Image uploaded successfully!');
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (error: unknown) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!session?.user?.id || !session?.user?.email) {
      setError('Please log in to schedule a post');
      toast.error('Please log in to schedule a post');
      return;
    }

    if (newPost.platform.includes('YOUTUBE') && !session?.user?.googleAccounts?.[0]?.id) {
      setError('No Google account connected for YouTube. Please connect a Google account.');
      toast.error('No Google account connected for YouTube. Please connect a Google account.');
      return;
    }

    try {
      if (!newPost.content || !newPost.scheduledAt || !newPost.platform) {
        setError('Please fill all required fields (content, platform, scheduled date)');
        toast.error('Please fill all required fields');
        return;
      }

      const scheduledAtLocal = new Date(newPost.scheduledAt);
      if (isNaN(scheduledAtLocal.getTime())) {
        setError('Invalid date format for scheduled time');
        toast.error('Invalid date format');
        return;
      }

      const platforms = newPost.platform.split(',').filter((p) => p);
      const existingPosts = posts.filter(
        (post) =>
          platforms.some((p) => post.platform.includes(p)) &&
          post.content === newPost.content &&
          new Date(post.scheduledAt).getTime() === scheduledAtLocal.getTime()
      );

      if (existingPosts.length > 0) {
        setError('A post with the same content and scheduled time already exists for one of the selected platforms.');
        toast.error('Post already exists for one of the platforms');
        return;
      }

      const postTableData = {
        userId: session.user.id,
        title: newPost.title || newPost.content,
        description: newPost.description,
        hashtags: newPost.hashtags,
        imageUrl: platforms.includes('YOUTUBE') ? newPost.mediaUrl : newPost.imageUrl,
        scheduledAt: scheduledAtLocal.toISOString().slice(0, -1),
        platforms: platforms.join(','),
      };

      const postResponse = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postTableData),
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        throw new Error(errorData.error || `Failed to create post in Post table (status: ${postResponse.status})`);
      }

      const postDataResult = await postResponse.json();

      for (const platform of platforms) {
        let postData: any = {
          content: newPost.content,
          platform,
          scheduledAt: scheduledAtLocal.toISOString().slice(0, -1),
          userId: session.user.id,
        };

        if (platform === 'YOUTUBE') {
          if (!newPost.mediaUrl) {
            setError('Video is required for YouTube');
            toast.error('Video is required for YouTube');
            return;
          }
          postData.mediaUrl = newPost.mediaUrl;
          continue;
        } else {
          if (!newPost.imageUrl) {
            setError('Image is required for other platforms');
            toast.error('Image is required for other platforms');
            return;
          }
          postData.mediaUrl = newPost.imageUrl;
        }

        const socialResponse = await fetch('/api/calendar/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });

        if (!socialResponse.ok) {
          const errorData = await socialResponse.json();
          throw new Error(errorData.error || `Failed to create post for ${platform} (status: ${socialResponse.status})`);
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

      const userResponse = await fetch('/api/user/settings');
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user settings');
      }
      const userData = await userResponse.json();

      if (userData.emailNotifications) {
        const emailData = {
          to_email: session.user.email,
          name: session.user.name || 'Friend',
          platforms: platforms.join(', '),
          scheduledAt: scheduledAtLocal.toLocaleString('en-US', {
            timeZone: 'Asia/Karachi',
            hour12: true,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          content: newPost.content,
        };

        const emailSendTime = scheduledAtLocal.getTime() - 60 * 60 * 1000;
        const currentTime = new Date().getTime();

        if (emailSendTime <= currentTime) {
          await sendEmail(emailData);
        } else {
          setTimeout(async () => await sendEmail(emailData), emailSendTime - currentTime);
        }
      }

      setNewPost({
        content: '',
        platform: '',
        scheduledAt: '',
        mediaUrl: '',
        description: '',
        tags: '',
        privacyStatus: 'private',
        imageUrl: '',
        title: '',
        hashtags: '',
      });
      setIsAddPostOpen(false);
      toast.success('Posts scheduled successfully!');
    } catch (error: unknown) {
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const sendEmail = async (emailData: Record<string, unknown>) => {
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      throw new Error('EmailJS configuration is missing.');
    }

    try {
      await emailjs.send(serviceId, templateId, emailData, publicKey);
      console.log('Email sent successfully to:', emailData.to_email);
      toast.success('Notification email sent!');
    } catch (error: unknown) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" className="text-primaryPurple" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div
        className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col items-center justify-center p-4`}
      >
        <h1 className="text-2xl font-bold mb-4 text-textBlack dark:text-white">
          Social Media Calendar
        </h1>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          You need to sign in to view the calendar.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200"
          aria-label="Go to login"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}
    >
      <TopBar />
      <div className="flex">
        <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <button
          className={`lg:hidden fixed top-4 right-4 z-50 p-2 text-white bg-primaryPurple rounded-full hover:bg-highlightBlue transition-all duration-200 ${
            isSidebarOpen ? 'hidden' : 'block'
          }`}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-2xl font-bold mb-6 text-textBlack dark:text-white">
            Social Media Calendar
          </h1>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border-l-4 border-primaryRed text-primaryRed dark:text-red-200 px-4 py-3 rounded-2xl mb-6">
              {error}
            </div>
          )}
          <button
            onClick={() => setIsAddPostOpen(true)}
            className="mb-6 px-6 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200"
            aria-label="Add new post"
          >
            Add Post
          </button>
          <SocialCalendar posts={posts} />

          <Transition show={isAddPostOpen}>
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
                <div className="flex min-h-full items-center justify-center p-4">
                  <Transition.Child
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                      <Dialog.Title
                        as="h3"
                        className="text-xl font-semibold text-textBlack dark:text-white"
                      >
                        Create New Post
                      </Dialog.Title>
                      <form onSubmit={handleAddPost} className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-textBlack dark:text-gray-200">
                            Platforms (Select Multiple)
                          </label>
                          <div className="mt-2 space-y-2">
                            {['YOUTUBE', 'INSTAGRAM', 'LINKEDIN', 'FACEBOOK'].map((platform) => (
                              <div key={platform} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={platform}
                                  value={platform}
                                  checked={newPost.platform.split(',').includes(platform)}
                                  onChange={(e) => {
                                    const platforms = newPost.platform.split(',').filter((p) => p);
                                    if (e.target.checked) {
                                      platforms.push(platform);
                                    } else {
                                      const index = platforms.indexOf(platform);
                                      if (index > -1) platforms.splice(index, 1);
                                    }
                                    setNewPost((prev) => ({
                                      ...prev,
                                      platform: platforms.join(','),
                                    }));
                                  }}
                                  className="h-4 w-4 text-primaryPurple focus:ring-highlightBlue border-gray-300 dark:border-gray-600 rounded"
                                />
                                <label
                                  htmlFor={platform}
                                  className="ml-2 text-sm text-textBlack dark:text-gray-200"
                                >
                                  {platform}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="content"
                            className="block text-sm font-medium text-textBlack dark:text-gray-200"
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
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-highlightBlue focus:ring-highlightBlue"
                            rows={4}
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="title"
                            className="block text-sm font-medium text-textBlack dark:text-gray-200"
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
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-highlightBlue focus:ring-highlightBlue"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-textBlack dark:text-gray-200"
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
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-highlightBlue focus:ring-highlightBlue"
                            rows={4}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="hashtags"
                            className="block text-sm font-medium text-textBlack dark:text-gray-200"
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
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-highlightBlue focus:ring-highlightBlue"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="scheduledAt"
                            className="block text-sm font-medium text-textBlack dark:text-gray-200"
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
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-highlightBlue focus:ring-highlightBlue"
                            required
                          />
                        </div>
                        {newPost.platform.includes('YOUTUBE') && (
                          <>
                            <div>
                              <label
                                htmlFor="tags"
                                className="block text-sm font-medium text-textBlack dark:text-gray-200"
                              >
                                Tags (comma-separated)
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
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-highlightBlue focus:ring-highlightBlue"
                                placeholder="tag1, tag2, tag3"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="privacyStatus"
                                className="block text-sm font-medium text-textBlack dark:text-gray-200"
                              >
                                Privacy Status
                              </label>
                              <select
                                id="privacyStatus"
                                value={newPost.privacyStatus}
                                onChange={(e) =>
                                  setNewPost((prev) => ({
                                    ...prev,
                                    privacyStatus: e.target.value as 'public' | 'private' | 'unlisted',
                                  }))
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-highlightBlue focus:ring-highlightBlue"
                              >
                                <option value="private">Private</option>
                                <option value="unlisted">Unlisted</option>
                                <option value="public">Public</option>
                              </select>
                            </div>
                            <div>
                              <label
                                htmlFor="mediaUrl"
                                className="block text-sm font-medium text-textBlack dark:text-gray-200"
                              >
                                Video Upload
                              </label>
                              <input
                                id="mediaUrl"
                                type="file"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primaryPurple file:text-white hover:file:bg-highlightBlue dark:file:bg-gray-700 dark:hover:file:bg-gray-600"
                              />
                            </div>
                          </>
                        )}
                        {newPost.platform.split(',').some((p) => ['INSTAGRAM', 'LINKEDIN', 'FACEBOOK'].includes(p)) && (
                          <div>
                            <label
                              htmlFor="imageUrl"
                              className="block text-sm font-medium text-textBlack dark:text-gray-200"
                            >
                              Image Upload
                            </label>
                            <input
                              id="imageUrl"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primaryPurple file:text-white hover:file:bg-highlightBlue dark:file:bg-gray-700 dark:hover:file:bg-gray-600"
                            />
                          </div>
                        )}
                        <div className="flex space-x-4">
                          <button
                            type="submit"
                            className="inline-flex justify-center rounded-lg bg-primaryPurple px-4 py-2 text-sm font-medium text-white hover:bg-highlightBlue hover:shadow-md transition-all duration-200"
                            aria-label="Schedule post"
                          >
                            Schedule Post
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddPostOpen(false)}
                            className="inline-flex justify-center rounded-lg bg-gray-300 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-textBlack dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600 transition-all duration-200"
                            aria-label="Cancel"
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
        </main>
      </div>
    </div>
  );
}