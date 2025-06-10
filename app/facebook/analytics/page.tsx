"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Link from "next/link";

interface FacebookInsight {
  name: string;
  period: string;
  values: { value: number; end_time: string }[];
  title: string;
  description: string;
}

interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  insights?: {
    data: {
      name: string;
      period: string;
      values: { value: number }[];
    }[];
  };
}

interface FacebookPageData {
  pageId: string;
  pageName: string;
  insights: FacebookInsight[];
  posts: FacebookPost[];
}

export default function FacebookAnalytics() {
  const { data: session, status } = useSession();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [pageData, setPageData] = useState<FacebookPageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const facebookAccounts = session?.user?.facebookAccounts || [];
  const hasConnectedFacebook = facebookAccounts.length > 0;

  // Set the first account as selected by default if not set
  useEffect(() => {
    if (hasConnectedFacebook && !selectedAccountId) {
      setSelectedAccountId(facebookAccounts[0].id);
    }
  }, [facebookAccounts, selectedAccountId, hasConnectedFacebook]);

  // Fetch insights when account is selected
  useEffect(() => {
    if (selectedAccountId) {
      fetchInsights(selectedAccountId);
    }
  }, [selectedAccountId]);

  // Function to fetch Facebook insights
  const fetchInsights = async (accountId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/facebook/insights?facebookAccountId=${accountId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch Facebook insights");
      }
      
      const data = await response.json();
      setPageData(data);
    } catch (err) {
      console.error("Error fetching Facebook insights:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle disconnecting a Facebook account
  const handleDisconnect = async (facebookAccountId: string) => {
    if (!confirm("Are you sure you want to disconnect this Facebook account?")) {
      return;
    }
    try {
      const response = await fetch("/api/facebook/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ facebookAccountId }),
      });
      if (response.ok) {
        // Refresh the session to update the list of connected accounts
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to disconnect Facebook account");
      }
    } catch (err) {
      console.error("Error disconnecting Facebook account:", err);
      setError("An error occurred while disconnecting the account");
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
        <h1 className="text-2xl font-bold mb-4">Facebook Analytics</h1>
        <p className="mb-4">You need to sign in to view Facebook analytics.</p>
        <button 
          onClick={() => router.push("/login")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Go to Login
        </button>
      </div>
    );
  }
  
  // Handle no connected Facebook accounts
  if (!hasConnectedFacebook) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Facebook Analytics</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-700 mb-4">
            You haven't connected any Facebook accounts yet.
          </p>
          <Link 
            href="/facebook" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Connect Facebook Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Facebook Analytics</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Connected Accounts Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Connected Facebook Accounts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facebookAccounts.map((account) => (
            <div key={account.id} className="bg-white rounded-lg shadow-md p-6 relative">
              <h3 className="font-semibold text-lg mb-2">{account.pageName || `Page ID: ${account.pageId}`}</h3>
              <button
                onClick={() => setSelectedAccountId(account.id)}
                className={`px-4 py-2 rounded-md mb-2 ${
                  selectedAccountId === account.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                {selectedAccountId === account.id ? "Selected" : "Select"}
              </button>
              <button
                onClick={() => handleDisconnect(account.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition absolute top-2 right-2"
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Section */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : selectedAccountId && pageData ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{pageData.pageName}</h2>
          
          {/* Interactive Charts */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Page Insights</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Impressions Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="font-medium text-gray-800 mb-2">Page Impressions</h4>
                <InsightsChart 
                  data={pageData.insights.find(i => i.name === "page_impressions")?.values || []}
                  color="#4f46e5"
                />
              </div>
              
              {/* Engaged Users Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="font-medium text-gray-800 mb-2">Engaged Users</h4>
                <InsightsChart 
                  data={pageData.insights.find(i => i.name === "page_engaged_users")?.values || []}
                  color="#06b6d4"
                />
              </div>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Page Fans */}
              <MetricCard
                title="Page Fans"
                value={pageData.insights.find(i => i.name === "page_fans")?.values[0]?.value || 0}
                icon="👥"
              />
              
              {/* Total Impressions */}
              <MetricCard
                title="Total Impressions"
                value={sumValues(pageData.insights.find(i => i.name === "page_impressions")?.values || [])}
                icon="👁️"
              />
              
              {/* Unique Impressions */}
              <MetricCard
                title="Unique Impressions"
                value={sumValues(pageData.insights.find(i => i.name === "page_impressions_unique")?.values || [])}
                icon="🔍"
              />
              
              {/* Post Engagements */}
              <MetricCard
                title="Post Engagements"
                value={sumValues(pageData.insights.find(i => i.name === "page_post_engagements")?.values || [])}
                icon="❤️"
              />
            </div>
          </div>
          
          {/* Recent Posts */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Recent Posts</h3>
            {pageData.posts.length > 0 ? (
              <div className="space-y-4">
                {pageData.posts.map(post => (
                  <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
                    <p className="text-gray-800 mb-2">{post.message || "(No message)"}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Posted on {new Date(post.created_time).toLocaleDateString()}
                    </p>
                    
                    {post.insights && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Impressions</p>
                          <p className="font-semibold">
                            {post.insights.data.find(i => i.name === "post_impressions")?.values[0]?.value || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Unique Views</p>
                          <p className="font-semibold">
                            {post.insights.data.find(i => i.name === "post_impressions_unique")?.values[0]?.value || 0}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-700">No recent posts found.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-700">Please select a Facebook account to view analytics.</p>
      )}
    </div>
  );
}

// Helper function to sum values from insights
function sumValues(values: { value: number; end_time?: string }[]): number {
  return values.reduce((sum, item) => sum + (item.value || 0), 0);
}

// Component for displaying a metric card
function MetricCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-2">
        <span className="text-2xl mr-2">{icon}</span>
        <h4 className="font-medium text-gray-800">{title}</h4>
      </div>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}

// Component for displaying a chart
function InsightsChart({ data, color }: { data: { value: number; end_time: string }[]; color: string }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500">No data available</p>;
  }
  
  // Get the last 14 days of data for display
  const displayData = data.slice(-14);
  
  // Find max value for scaling
  const maxValue = Math.max(...displayData.map(d => d.value));
  
  return (
    <div className="h-60">
      <div className="flex items-end h-48 space-x-1">
        {displayData.map((item, index) => {
          const height = maxValue ? (item.value / maxValue) * 100 : 0;
          const date = new Date(item.end_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="relative w-full group">
                <div 
                  className="w-full hover:opacity-80 transition-opacity"
                  style={{ 
                    height: `${height}%`, 
                    backgroundColor: color,
                    minHeight: item.value > 0 ? '4px' : '0'
                  }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                    {item.value.toLocaleString()} on {date}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500 mt-1 rotate-45 origin-left">
                {date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}