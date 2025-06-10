// app/facebook/page.tsx
"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRouter } from "next/navigation";

export default function FacebookPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if a Facebook account is already connected
  const hasConnectedFacebook = session?.user?.facebookAccounts && session.user.facebookAccounts.length > 0;

  // If we have a Facebook connection in the session (just connected), fetch pages
  useEffect(() => {
    if (session?.facebookConnection?.accessToken) {
      fetchFacebookPages(session.facebookConnection.accessToken);
    }
  }, [session?.facebookConnection?.accessToken]);

  // Function to fetch Facebook pages
  const fetchFacebookPages = async (accessToken: string) => {
    setIsLoadingPages(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/facebook/pages?accessToken=${accessToken}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch Facebook pages");
      }
      
      const data = await response.json();
      setFacebookPages(data.pages || []);
    } catch (err) {
      console.error("Error fetching Facebook pages:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoadingPages(false);
    }
  };

  // Function to connect a Facebook page
  const connectPage = async (pageId: string, pageName: string, pageAccessToken: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/facebook/connect-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageId,
          pageName,
          pageAccessToken,
          userId: session?.user.id,
          facebookAccountId: session?.user.facebookAccounts?.[0]?.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to connect Facebook page");
      }
      
      // Refresh the session to get updated Facebook accounts
      router.refresh();
      
    } catch (err) {
      console.error("Error connecting page:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle loading state
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Handle unauthenticated users
  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Facebook Connection</h1>
        <p className="mb-4">You need to sign in to connect your Facebook account.</p>
        <button 
          onClick={() => router.push("/login")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Connect Facebook Account</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Display connected accounts */}
      {hasConnectedFacebook ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Connected Facebook Accounts</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-700">
              Your Facebook account is connected. You can view your Facebook analytics on the dashboard.
            </p>
            <div className="mt-4">
              <Link 
                href="/facebook/analytics" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                View Facebook Analytics
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-700 mb-4">
              Connect your Facebook account to access Facebook analytics and manage your pages.
            </p>
            <button
              onClick={() => {
                setIsLoading(true);
                signIn("facebook", {
                  callbackUrl: "/facebook",
                });
              }}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-[#1877F2] text-white rounded-md hover:bg-[#166FE5] transition disabled:opacity-50"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <svg 
                  className="w-5 h-5 mr-2" 
                  fill="#FFFFFF" 
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              Connect with Facebook
            </button>
          </div>
        </div>
      )}
      
      {/* Display Facebook pages if we just connected */}
      {session?.facebookConnection?.accessToken && facebookPages.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Select a Facebook Page to Connect</h2>
          {isLoadingPages ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facebookPages.map((page) => (
                <div key={page.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-semibold text-lg mb-2">{page.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">ID: {page.id}</p>
                  <button
                    onClick={() => connectPage(page.id, page.name, page.access_token)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : "Connect Page"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}