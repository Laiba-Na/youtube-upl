"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConnectGoogle() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === "unauthenticated") {
      router.push("/login");
    }

    // Check if we have a session and if Google is connected
    if (status === "authenticated") {
      console.log("Session data:", session); // Debug log

      if (session?.user?.googleConnected) {
        console.log("Google connected, redirecting to upload");
        router.push("/upload");
      }
    }
  }, [status, session, router]);

  // If we're coming back from Google auth, we may need to refresh the session
  useEffect(() => {
    // Check for Google auth return in URL (presence of code parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    // If we have a code parameter and we're authenticated but not showing as Google connected
    if (code && status === "authenticated" && !session?.user?.googleConnected) {
      console.log("Detected Google auth return, refreshing session");

      // Refresh the session to get updated data
      const refreshSession = async () => {
        await update(); // Force session refresh

        // After update, check again
        if (session?.user?.googleConnected) {
          router.push("/upload");
        }
      };

      refreshSession();
    }
  }, [status, session, router, update]);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setError("");

    try {
      await signIn("google", {
        callbackUrl: "/connect-google", // Return to this page to allow us to check the session
        redirect: true,
      });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Failed to connect with Google. Please try again.");
      setIsConnecting(false);
    }
  };

  if (status === "loading" || isConnecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connect Your Google Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect your Google account to upload videos to YouTube
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={handleConnectGoogle}
              disabled={isConnecting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
            >
              {isConnecting ? "Connecting..." : "Connect with Google"}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
