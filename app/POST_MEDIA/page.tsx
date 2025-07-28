// app/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const handleRedirectToPosts = () => {
    router.push("/post-catalog"); // Fix 1: Fixed case sensitivity in route
  };

  const handleRedirectToYouTubeUpload = () => {
    router.push("/youtube/upload"); // Fix 2: Added handler for YouTube upload redirect
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primaryPurple to-primaryRed">
      <div className="text-center">
        <div className="flex justify-center items-center space-x-2 mb-6">
          <span className="w-3 h-3 rounded-full bg-primaryPurple"></span>
          <span className="w-3 h-3 rounded-full bg-textBlack"></span>
          <span className="w-3 h-3 rounded-full bg-primaryRed"></span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-6">Welcome</h1>
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleRedirectToPosts}
            className="px-6 py-2 border border-white rounded-full text-white hover:bg-white hover:text-primaryPurple transition-colors"
          >
            View Your Posts
          </button>
          <button
            onClick={handleRedirectToYouTubeUpload}
            className="px-6 py-2 border border-white rounded-full text-white hover:bg-white hover:text-primaryPurple transition-colors"
          >
            Upload to YouTube
          </button>
        </div>
      </div>
    </div>
  );
}

