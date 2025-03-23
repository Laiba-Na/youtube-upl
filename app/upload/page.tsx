"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Upload() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

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
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === "unauthenticated") {
      router.push("/login");
    }

    // If authenticated but Google not connected, redirect to connect-google
    if (status === "authenticated" && !session?.user?.googleConnected) {
      router.push("/connect-google");
    }

    // Fetch user playlists if authenticated and Google connected
    if (status === "authenticated" && session?.user?.googleConnected) {
      fetchUserPlaylists();
    }
  }, [status, session, router]);

  const fetchUserPlaylists = async () => {
    setLoadingPlaylists(true);
    setError("");

    try {
      console.log("Fetching playlists...");
      const response = await fetch("/api/youtube/playlists", {
        // Include credentials to ensure cookies are sent
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      console.log("Response status:", response.status);

      // Log the raw response text for debugging
      const responseText = await response.text();
      console.log("Response text:", responseText);

      // If response is not ok, throw an error
      if (!response.ok) {
        throw new Error(`Failed to fetch playlists: ${responseText}`);
      }

      // Parse JSON separately
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Playlists data:", data);
        setPlaylists(data.playlists || []);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error(`Failed to parse playlist data: ${responseText}`);
      }
    } catch (error: any) {
      console.error("Error fetching playlists:", error);
      setError(error.message || "Failed to fetch playlists");
      setDebugInfo({ error: error.message, stack: error.stack });
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleRetryFetchPlaylists = () => {
    fetchUserPlaylists();
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log(
        `Selected video file: ${file.name} (${file.size} bytes, type: ${file.type})`
      );
      setVideoFile(file);
    }
  };

  const handleThumbnailFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log(
        `Selected thumbnail: ${file.name} (${file.size} bytes, type: ${file.type})`
      );
      setThumbnailFile(file);

      // Create preview URL
      const fileUrl = URL.createObjectURL(file);
      setThumbnailPreview(fileUrl);
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

    // Check video file size (max 128MB for testing, adjust as needed)
    const maxVideoSize = 128 * 1024 * 1024; // 128MB
    if (videoFile.size > maxVideoSize) {
      setError(
        `Video file too large. Maximum size is ${
          maxVideoSize / (1024 * 1024)
        }MB`
      );
      return false;
    }

    // Check thumbnail file if selected
    if (thumbnailFile) {
      // Check thumbnail size (max 2MB)
      const maxThumbnailSize = 2 * 1024 * 1024; // 2MB
      if (thumbnailFile.size > maxThumbnailSize) {
        setError(
          `Thumbnail file too large. Maximum size is ${
            maxThumbnailSize / (1024 * 1024)
          }MB`
        );
        return false;
      }

      // Check if it's a valid image format
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(thumbnailFile.type)) {
        setError("Thumbnail must be a JPEG or PNG file");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setDebugInfo(null);

    if (!validateForm()) {
      return;
    }

    setIsUploading(true);

    // Show progress animation
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

      if (videoFile) {
        formData.append("videoFile", videoFile);
      }

      if (thumbnailFile) {
        formData.append("thumbnailFile", thumbnailFile);
      }

      console.log("Submitting form data:", {
        title,
        description,
        tags,
        madeForKids,
        privacyStatus,
        playlistId: selectedPlaylist || "none",
        videoFile: videoFile
          ? `${videoFile.name} (${videoFile.size} bytes)`
          : "none",
        thumbnailFile: thumbnailFile
          ? `${thumbnailFile.name} (${thumbnailFile.size} bytes)`
          : "none",
      });

      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      clearInterval(progressInterval);

      // Get response as text first to handle both JSON and non-JSON responses
      const responseText = await response.text();

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // If not JSON, use the raw text
        data = { message: responseText };
      }

      // For debugging, save response info
      setDebugInfo({
        status: response.status,
        statusText: response.statusText,
        data,
      });

      if (!response.ok) {
        throw new Error(data.message || responseText || "Upload failed");
      }

      setUploadProgress(100);
      setMessage(`Video uploaded successfully! Video ID: ${data.videoId}`);

      // Reset form
      setTitle("");
      setDescription("");
      setTags("");
      setVideoFile(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setMadeForKids(false);
      setPrivacyStatus("private");
      setSelectedPlaylist("");

      // Reset file input
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      setError(error.message || "Something went wrong");
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
  // In your upload page
  if (
    status === "authenticated" &&
    session?.user?.googleConnected &&
    error.includes("Insufficient Permission")
  ) {
    // Show a message asking the user to reconnect their Google account with new permissions
    return (
      <div>
        <p>We need additional permissions to access your YouTube playlists.</p>
        <button onClick={() => router.push("/connect-google")}>
          Reconnect Google Account
        </button>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Upload Video to YouTube
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Upload your video directly to your YouTube channel
          </p>
        </div>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            {error.includes("Failed to fetch playlists") && (
              <button
                onClick={handleRetryFetchPlaylists}
                className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
              >
                Retry Loading Playlists
              </button>
            )}
          </div>
        )}

        {/* Connection status */}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <p>
            <strong>Status:</strong>{" "}
            {status === "authenticated" ? "Signed in" : "Not signed in"}
          </p>
          <p>
            <strong>Google Connected:</strong>{" "}
            {session?.user?.googleConnected ? "Yes" : "No"}
          </p>
          {session?.user?.email && (
            <p>
              <strong>Email:</strong> {session.user.email}
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} ref={formRef}>
          <div className="space-y-4">
            {/* Required fields section */}
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
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
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
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
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
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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

            {/* Additional options section */}
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
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
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
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
                      onClick={handleRetryFetchPlaylists}
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

          <div>
            <button
              type="submit"
              disabled={isUploading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {isUploading ? "Uploading..." : "Upload Video"}
            </button>
          </div>
        </form>

        {/* Debug information */}
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
