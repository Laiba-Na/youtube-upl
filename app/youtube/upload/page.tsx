'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '@/app/DarkModeContext';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/sideBar';
import { Menu } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import toast from 'react-hot-toast';

interface GoogleAccount {
  id: string;
  googleEmail: string;
}

interface Playlist {
  id: string;
  title: string;
}

interface DebugInfo {
  status: number;
  statusText: string;
  data: any;
}

export default function Upload() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [madeForKids, setMadeForKids] = useState(false);
  const [privacyStatus, setPrivacyStatus] = useState<'private' | 'public' | 'unlisted'>('private');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [selectedGoogleAccountId, setSelectedGoogleAccountId] = useState('');

  // Upload and UI state
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (
      status === 'authenticated' &&
      (!session?.user?.googleAccounts || session.user.googleAccounts.length === 0)
    ) {
      router.push('/connect-google');
    }
    if (
      status === 'authenticated' &&
      session?.user?.googleAccounts &&
      session.user.googleAccounts.length > 0 &&
      !selectedGoogleAccountId
    ) {
      setSelectedGoogleAccountId(session.user.googleAccounts[0].id);
    }
  }, [status, session, router, selectedGoogleAccountId]);

  useEffect(() => {
    if (selectedGoogleAccountId) {
      fetchUserPlaylists();
    }
  }, [selectedGoogleAccountId]);

  const fetchUserPlaylists = async () => {
    setLoadingPlaylists(true);
    setError('');
    try {
      const response = await fetch(`/api/youtube/playlists?googleAccountId=${selectedGoogleAccountId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch playlists');
      }
      const data = await response.json();
      setPlaylists(data.playlists || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch playlists';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    if (!session?.user?.id) {
      setError('Please log in to upload a video');
      toast.error('Please log in to upload a video');
      return false;
    }
    if (!title.trim()) {
      setError('Please enter a title');
      toast.error('Please enter a title');
      return false;
    }
    if (!description.trim()) {
      setError('Please enter a description');
      toast.error('Please enter a description');
      return false;
    }
    if (!videoFile) {
      setError('Please select a video file');
      toast.error('Please select a video file');
      return false;
    }
    if (!privacyStatus) {
      setError('Please select a privacy setting');
      toast.error('Please select a privacy setting');
      return false;
    }
    const maxVideoSize = 128 * 1024 * 1024; // 128MB
    if (videoFile.size > maxVideoSize) {
      setError(`Video file too large. Maximum size is ${maxVideoSize / (1024 * 1024)} MB`);
      toast.error(`Video file too large. Maximum size is ${maxVideoSize / (1024 * 1024)} MB`);
      return false;
    }
    if (thumbnailFile) {
      const maxThumbnailSize = 2 * 1024 * 1024; // 2MB
      if (thumbnailFile.size > maxThumbnailSize) {
        setError(`Thumbnail file too large. Maximum size is ${maxThumbnailSize / (1024 * 1024)} MB`);
        toast.error(`Thumbnail file too large. Maximum size is ${maxThumbnailSize / (1024 * 1024)} MB`);
        return false;
      }
      const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validImageTypes.includes(thumbnailFile.type)) {
        setError('Thumbnail must be a JPEG or PNG file');
        toast.error('Thumbnail must be a JPEG or PNG file');
        return false;
      }
    }
    if (!selectedGoogleAccountId) {
      setError('Please select a Google account for uploading');
      toast.error('Please select a Google account for uploading');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDebugInfo(null);

    if (!validateForm()) return;

    setIsUploading(true);
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('tags', tags);
      formData.append('madeForKids', madeForKids.toString());
      formData.append('privacyStatus', privacyStatus);
      if (selectedPlaylist) {
        formData.append('playlistId', selectedPlaylist);
      }
      formData.append('googleAccountId', selectedGoogleAccountId);
      if (videoFile) {
        formData.append('videoFile', videoFile);
      }
      if (thumbnailFile) {
        formData.append('thumbnailFile', thumbnailFile);
      }

      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      clearInterval(progressInterval);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Upload failed: ${response.statusText}`);
      }

      setUploadProgress(100);
      setMessage(`Video uploaded successfully! Video ID: ${data.videoId}`);

      // Save to Post and SocialPost tables
      const postData = {
        userId: session!.user!.id,
        title,
        description,
        hashtags: tags,
        imageUrl: thumbnailFile ? URL.createObjectURL(thumbnailFile) : '',
        platforms: 'YOUTUBE',
        scheduledAt: new Date().toISOString(),
      };

      const postResponse = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        throw new Error(errorData.message || 'Failed to save post');
      }

      const postResult = await postResponse.json();

      const socialPostData = {
        userId: session!.user!.id,
        content: description,
        platform: 'YOUTUBE',
        scheduledAt: new Date().toISOString(),
        mediaUrl: data.url || '',
        status: 'POSTED',
        postId: postResult.id,
      };

      const socialPostResponse = await fetch('/api/calendar/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socialPostData),
      });

      if (!socialPostResponse.ok) {
        const errorData = await socialPostResponse.json();
        throw new Error(errorData.message || 'Failed to save social post');
      }

      // Reset form
      setTitle('');
      setDescription('');
      setTags('');
      setVideoFile(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setMadeForKids(false);
      setPrivacyStatus('private');
      setSelectedPlaylist('');
      if (formRef.current) {
        formRef.current.reset();
      }
      toast.success('Video uploaded and saved successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      setDebugInfo({
        status: err instanceof Error ? 500 : (err as any).status,
        statusText: err instanceof Error ? err.message : (err as any).statusText,
        data: { message: errorMessage },
      });
      setUploadProgress(0);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      clearInterval(progressInterval);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" className="text-primaryPurple" />
      </div>
    );
  }

  if (
    status === 'authenticated' &&
    session?.user &&
    (!session.user.googleAccounts || session.user.googleAccounts.length === 0)
  ) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} px-4`}>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-md w-full text-center">
          <p className="text-textBlack dark:text-gray-200">
            No connected Google accounts. Please connect your Google account first.
          </p>
          <button
            onClick={() => router.push('/connect-google')}
            className="mt-4 px-4 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200"
            aria-label="Connect Google account"
          >
            Connect Google Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
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
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
            <h2 className="text-center text-3xl font-extrabold text-textBlack dark:text-white mb-6">
              Upload Video to YouTube
            </h2>

            {message && (
              <div className="mb-6 border border-highlightBlue bg-highlightBlue/10 text-highlightBlue px-4 py-3 rounded-2xl">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-6 border border-primaryRed bg-primaryRed/10 text-primaryRed dark:text-red-200 px-4 py-3 rounded-2xl">
                {error}
              </div>
            )}

            <div className="bg-highlightBlue/10 border border-highlightBlue/50 text-textBlack dark:text-gray-200 px-4 py-3 rounded-2xl mb-6">
              <p>
                <strong>Status:</strong> {status === 'authenticated' ? 'Signed in' : 'Not signed in'}
              </p>
              {session?.user?.email && (
                <p>
                  <strong>Email:</strong> {session.user.email}
                </p>
              )}
              {session?.user?.googleAccounts && session.user.googleAccounts.length > 0 && (
                <div className="mt-2">
                  <label
                    htmlFor="googleAccount"
                    className="block text-sm font-medium text-textBlack dark:text-gray-200"
                  >
                    Select Google Account for Upload
                  </label>
                  <select
                    id="googleAccount"
                    value={selectedGoogleAccountId}
                    onChange={(e) => setSelectedGoogleAccountId(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue"
                    disabled={isUploading}
                  >
                    {session.user.googleAccounts.map((acc: GoogleAccount) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.googleEmail}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} ref={formRef} className="space-y-6">
              <div className="bg-highlightBlue/5 p-6 rounded-2xl border border-highlightBlue/20">
                <h3 className="text-lg font-medium text-textBlack dark:text-white mb-4">
                  Required Information
                </h3>
                <div className="mb-4">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-textBlack dark:text-gray-200"
                  >
                    Video Title <span className="text-primaryRed">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    aria-required="true"
                    className="mt-1 block w-full rounded-lg p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue"
                    placeholder="Enter video title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-textBlack dark:text-gray-200"
                  >
                    Description <span className="text-primaryRed">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    required
                    aria-required="true"
                    className="mt-1 block w-full rounded-lg p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue"
                    placeholder="Enter video description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="videoFile"
                    className="block text-sm font-medium text-textBlack dark:text-gray-200"
                  >
                    Video File <span className="text-primaryRed">*</span>
                  </label>
                  <input
                    id="videoFile"
                    name="videoFile"
                    type="file"
                    accept="video/*"
                    required
                    aria-required="true"
                    className="mt-1 block w-full text-sm text-textBlack dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primaryPurple file:text-white hover:file:bg-highlightBlue dark:file:bg-gray-700 dark:hover:file:bg-gray-600"
                    onChange={handleVideoFileChange}
                    disabled={isUploading}
                  />
                  {videoFile && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="madeForKids"
                      className="block text-sm font-medium text-textBlack dark:text-gray-200"
                    >
                      Audience <span className="text-primaryRed">*</span>
                    </label>
                    <div className="mt-2 space-y-2">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="madeForKids"
                          checked={!madeForKids}
                          onChange={() => setMadeForKids(false)}
                          className="h-4 w-4 text-highlightBlue focus:ring-highlightBlue border-gray-300 dark:border-gray-600"
                          disabled={isUploading}
                          aria-label="Not made for kids"
                        />
                        <span className="ml-2 text-sm text-textBlack dark:text-gray-200">
                          Not made for kids
                        </span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="madeForKids"
                          checked={madeForKids}
                          onChange={() => setMadeForKids(true)}
                          className="h-4 w-4 text-highlightBlue focus:ring-highlightBlue border-gray-300 dark:border-gray-600"
                          disabled={isUploading}
                          aria-label="Made for kids"
                        />
                        <span className="ml-2 text-sm text-textBlack dark:text-gray-200">
                          Made for kids
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="privacyStatus"
                      className="block text-sm font-medium text-textBlack dark:text-gray-200"
                    >
                      Visibility <span className="text-primaryRed">*</span>
                    </label>
                    <select
                      id="privacyStatus"
                      name="privacyStatus"
                      value={privacyStatus}
                      onChange={(e) => setPrivacyStatus(e.target.value as 'private' | 'public' | 'unlisted')}
                      className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue"
                      disabled={isUploading}
                      required
                      aria-required="true"
                    >
                      <option value="private">Private</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-highlightBlue/5 p-6 rounded-2xl border border-highlightBlue/20">
                <h3 className="text-lg font-medium text-textBlack dark:text-white mb-4">
                  Additional Options
                </h3>
                <div className="mb-4">
                  <label
                    htmlFor="tags"
                    className="block text-sm font-medium text-textBlack dark:text-gray-200"
                  >
                    Tags (comma-separated)
                  </label>
                  <input
                    id="tags"
                    name="tags"
                    type="text"
                    className="mt-1 block w-full rounded-lg p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue"
                    placeholder="tag1, tag2, tag3"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="thumbnailFile"
                    className="block text-sm font-medium text-textBlack dark:text-gray-200"
                  >
                    Custom Thumbnail (JPEG or PNG, max 2MB)
                  </label>
                  <input
                    id="thumbnailFile"
                    name="thumbnailFile"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="mt-1 block w-full text-sm text-textBlack dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primaryPurple file:text-white hover:file:bg-highlightBlue dark:file:bg-gray-700 dark:hover:file:bg-gray-600"
                    onChange={handleThumbnailFileChange}
                    disabled={isUploading}
                  />
                  {thumbnailFile && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Selected: {thumbnailFile.name} ({(thumbnailFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                  {thumbnailPreview && (
                    <div className="mt-2">
                      <p className="text-sm text-textBlack dark:text-gray-200 mb-1">Preview:</p>
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-48 h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="playlist"
                    className="block text-sm font-medium text-textBlack dark:text-gray-200"
                  >
                    Add to Playlist
                  </label>
                  {loadingPlaylists ? (
                    <div className="flex items-center mt-1">
                      <LoadingSpinner size="sm" className="text-primaryPurple mr-2" />
                      <p className="text-sm text-textBlack dark:text-gray-200">Loading playlists...</p>
                    </div>
                  ) : playlists.length > 0 ? (
                    <select
                      id="playlist"
                      name="playlist"
                      value={selectedPlaylist}
                      onChange={(e) => setSelectedPlaylist(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue"
                      disabled={isUploading}
                    >
                      <option value="">None</option>
                      {playlists.map((playlist) => (
                        <option key={playlist.id} value={playlist.id}>
                          {playlist.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center mt-1">
                      <p className="text-sm text-textBlack dark:text-gray-200 mr-2">
                        {error.includes('Failed to fetch playlists') ? 'Error loading playlists' : 'No playlists available'}
                      </p>
                      <button
                        type="button"
                        onClick={fetchUserPlaylists}
                        className="px-3 py-1 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue text-sm"
                        aria-label="Refresh playlists"
                      >
                        Refresh
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isUploading && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-textBlack dark:text-white">
                    Upload Progress: {uploadProgress}%
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-primaryPurple h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex space-x-4">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-2 px-4 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-highlightBlue disabled:bg-primaryPurple/50 transition-all duration-200"
                  aria-label={isUploading ? 'Uploading video' : 'Upload video'}
                >
                  {isUploading ? 'Uploading...' : 'Upload Video'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/calendar')}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-textBlack dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-all duration-200"
                  aria-label="Back to calendar"
                >
                  Back to Calendar
                </button>
              </div>
            </form>

            {debugInfo && (
              <div className="mt-6 p-4 bg-highlightBlue/5 rounded-2xl border border-highlightBlue/20">
                <h3 className="text-lg font-medium text-textBlack dark:text-white">Debug Information:</h3>
                <pre className="mt-2 text-xs overflow-auto p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-textBlack dark:text-gray-200">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}