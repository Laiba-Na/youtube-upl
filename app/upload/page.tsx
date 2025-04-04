"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Upload() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [madeForKids, setMadeForKids] = useState(false);
  const [privacyStatus, setPrivacyStatus] = useState("private");
  const [playlists, setPlaylists] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [selectedGoogleAccountId, setSelectedGoogleAccountId] = useState("");

  // Upload and UI state
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    // If authenticated but no connected Google accounts exist, redirect to connect page
    if (
      status === "authenticated" &&
      (!session?.user?.googleAccounts ||
        session.user.googleAccounts.length === 0)
    ) {
      router.push("/connect-google");
    }
    // If authenticated and Google accounts exist, set the default selection and fetch playlists
    if (
      status === "authenticated" &&
      session?.user?.googleAccounts &&
      session.user.googleAccounts.length > 0
    ) {
      if (!selectedGoogleAccountId) {
        setSelectedGoogleAccountId(session.user.googleAccounts[0].id);
      }
      fetchUserPlaylists();
    }
  }, [status, session, router, selectedGoogleAccountId]);

  const fetchUserPlaylists = async () => {
    setLoadingPlaylists(true);
    setError("");
    try {
      const response = await fetch("/api/youtube/playlists", {
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch playlists");
      }
      const data = await response.json();
      setPlaylists(data.playlists || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch playlists");
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleThumbnailFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return false;
    }
    if (!description.trim()) {
      setError("Please enter a description");
      return false;
    }
    if (!videoFile) {
      setError("Please select a video file");
      return false;
    }
    if (!privacyStatus) {
      setError("Please select a privacy setting");
      return false;
    }
    // Video file size check (max 128MB)
    const maxVideoSize = 128 * 1024 * 1024;
    if (videoFile.size > maxVideoSize) {
      setError(
        `Video file too large. Maximum size is ${
          maxVideoSize / (1024 * 1024)
        } MB`
      );
      return false;
    }
    // Thumbnail file check (if exists, max 2MB & valid image format)
    if (thumbnailFile) {
      const maxThumbnailSize = 2 * 1024 * 1024;
      if (thumbnailFile.size > maxThumbnailSize) {
        setError(
          `Thumbnail file too large. Maximum size is ${
            maxThumbnailSize / (1024 * 1024)
          } MB`
        );
        return false;
      }
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(thumbnailFile.type)) {
        setError("Thumbnail must be a JPEG or PNG file");
        return false;
      }
    }
    if (!selectedGoogleAccountId) {
      setError("Please select a Google account for uploading");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
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
      formData.append("title", title);
      formData.append("description", description);
      formData.append("tags", tags);
      formData.append("madeForKids", madeForKids.toString());
      formData.append("privacyStatus", privacyStatus);
      if (selectedPlaylist) {
        formData.append("playlistId", selectedPlaylist);
      }
      // Append selected Google account ID so that the API uses the right connection
      formData.append("googleAccountId", selectedGoogleAccountId);
      if (videoFile) {
        formData.append("videoFile", videoFile);
      }
      if (thumbnailFile) {
        formData.append("thumbnailFile", thumbnailFile);
      }
      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      clearInterval(progressInterval);

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { message: responseText };
      }
      setDebugInfo({
        status: response.status,
        statusText: response.statusText,
        data,
      });
      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }
      setUploadProgress(100);
      setMessage(`Video uploaded successfully! Video ID: ${data.videoId}`);
      // Reset the form fields
      setTitle("");
      setDescription("");
      setTags("");
      setVideoFile(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setMadeForKids(false);
      setPrivacyStatus("private");
      setSelectedPlaylist("");
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || "Something went wrong");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  // If authenticated but no connected Google accounts exist, prompt user to connect one.
  if (
    status === "authenticated" &&
    session?.user &&
    (!session.user.googleAccounts || session.user.googleAccounts.length === 0)
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>
          No connected Google accounts. Please connect your Google account
          first.
        </p>
        <button
          onClick={() => router.push("/connect-google")}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Connect Google Account
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-4">
          Upload Video to YouTube
        </h2>
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {/* Display connection status and allow account selection */}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
          <p>
            <strong>Status:</strong>{" "}
            {status === "authenticated" ? "Signed in" : "Not signed in"}
          </p>
          {session?.user?.email && (
            <p>
              <strong>Email:</strong> {session.user.email}
            </p>
          )}
          {session?.user?.googleAccounts &&
            session.user.googleAccounts.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold">
                  Select Google Account for Upload:
                </p>
                <select
                  value={selectedGoogleAccountId}
                  onChange={(e) => setSelectedGoogleAccountId(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  {session.user.googleAccounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.googleEmail}
                    </option>
                  ))}
                </select>
              </div>
            )}
        </div>
        {/* Upload form */}
        <form onSubmit={handleSubmit} ref={formRef}>
          <div className="space-y-4">
            {/* Required Information */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Required Information
              </h3>
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Video Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter video title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  className="mt-1 block w-full rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter video description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading}
                ></textarea>
              </div>
              <div className="mb-4">
                <label
                  htmlFor="videoFile"
                  className="block text-sm font-medium text-gray-700"
                >
                  Video File <span className="text-red-500">*</span>
                </label>
                <input
                  id="videoFile"
                  name="videoFile"
                  type="file"
                  accept="video/*"
                  required
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  onChange={handleVideoFileChange}
                  disabled={isUploading}
                />
                {videoFile && (
                  <p className="mt-1 text-sm text-gray-500">
                    Selected: {videoFile.name} (
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="madeForKids"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Audience <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <label className="inline-flex items-center mr-4">
                      <input
                        type="radio"
                        name="madeForKids"
                        checked={!madeForKids}
                        onChange={() => setMadeForKids(false)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        disabled={isUploading}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Not made for kids
                      </span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="madeForKids"
                        checked={madeForKids}
                        onChange={() => setMadeForKids(true)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        disabled={isUploading}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Made for kids
                      </span>
                    </label>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="privacyStatus"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Visibility <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="privacyStatus"
                    name="privacyStatus"
                    value={privacyStatus}
                    onChange={(e) => setPrivacyStatus(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                    disabled={isUploading}
                    required
                  >
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Additional Options */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Additional Options
              </h3>
              <div className="mb-4">
                <label
                  htmlFor="tags"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tags (comma separated)
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  className="mt-1 block w-full rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="tag1, tag2, tag3"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={isUploading}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="thumbnailFile"
                  className="block text-sm font-medium text-gray-700"
                >
                  Custom Thumbnail (JPEG or PNG, max 2MB)
                </label>
                <input
                  id="thumbnailFile"
                  name="thumbnailFile"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  onChange={handleThumbnailFileChange}
                  disabled={isUploading}
                />
                {thumbnailFile && (
                  <p className="mt-1 text-sm text-gray-500">
                    Selected: {thumbnailFile.name} (
                    {(thumbnailFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                {thumbnailPreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Preview:</p>
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-48 h-auto rounded border border-gray-300"
                    />
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label
                  htmlFor="playlist"
                  className="block text-sm font-medium text-gray-700"
                >
                  Add to Playlist
                </label>
                {loadingPlaylists ? (
                  <p className="text-sm text-gray-500 mt-1">
                    Loading playlists...
                  </p>
                ) : playlists.length > 0 ? (
                  <select
                    id="playlist"
                    name="playlist"
                    value={selectedPlaylist}
                    onChange={(e) => setSelectedPlaylist(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
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
                  <div className="flex items-center">
                    <p className="text-sm text-gray-500 mt-1 mr-2">
                      {error.includes("Failed to fetch playlists")
                        ? "Error loading playlists"
                        : "No playlists available"}
                    </p>
                    <button
                      type="button"
                      onClick={fetchUserPlaylists}
                      className="mt-1 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-xs"
                    >
                      Refresh Playlists
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {isUploading && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">
                Upload Progress: {uploadProgress}%
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          <div className="mt-4">
            <button
              type="submit"
              disabled={isUploading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {isUploading ? "Uploading..." : "Upload Video"}
            </button>
          </div>
        </form>
        {debugInfo && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <h3 className="text-lg font-medium">Debug Information:</h3>
            <pre className="mt-2 text-xs overflow-auto p-2 bg-gray-200 rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
