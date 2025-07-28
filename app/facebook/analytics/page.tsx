'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '@/app/DarkModeContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/sideBar';
import { Menu } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  const { darkMode } = useDarkMode();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [pageData, setPageData] = useState<FacebookPageData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const router = useRouter();

  //@ts-ignore
  const facebookAccounts: { id: string; pageName?: string; pageId: string }[] =
    session?.user?.facebookAccounts || [];
  const hasConnectedFacebook: boolean = facebookAccounts.length > 0;

  useEffect(() => {
    if (hasConnectedFacebook && !selectedAccountId && facebookAccounts[0]?.id) {
      setSelectedAccountId(facebookAccounts[0].id);
    }
  }, [facebookAccounts, selectedAccountId, hasConnectedFacebook]);

  useEffect(() => {
    if (selectedAccountId) {
      fetchInsights(selectedAccountId);
    }
  }, [selectedAccountId]);

  const fetchInsights = async (accountId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/facebook/insights?facebookAccountId=${accountId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch Facebook insights');
      }
      const data: FacebookPageData = await response.json();
      setPageData(data);
    } catch (err: unknown) {
      console.error('Error fetching Facebook insights:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (facebookAccountId: string): Promise<void> => {
    if (!confirm('Are you sure you want to disconnect this Facebook account?')) {
      return;
    }
    try {
      const response = await fetch('/api/facebook/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ facebookAccountId }),
      });
      if (response.ok) {
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to disconnect Facebook account');
      }
    } catch (err: unknown) {
      console.error('Error disconnecting Facebook account:', err);
      setError('An error occurred while disconnecting the account');
    }
  };

  const sumValues = (values: { value: number; end_time?: string }[]): number => {
    return values.reduce((sum, item) => sum + (item.value || 0), 0);
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
        className={`min-h-screen ${
          darkMode ? 'bg-gray-900' : 'bg-gray-50'
        } flex flex-col items-center justify-center p-4`}
      >
        <h1 className="text-2xl font-bold mb-4 text-textBlack dark:text-white">
          Facebook Analytics
        </h1>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          You need to sign in to view Facebook analytics.
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

  if (!hasConnectedFacebook) {
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
              Facebook Analytics
            </h1>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You haven't connected any Facebook accounts yet.
              </p>
              <Link
                href="/facebook"
                className="px-4 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200"
                aria-label="Connect Facebook account"
              >
                Connect Facebook Account
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const impressionsData = pageData?.insights.find((i) => i.name === 'page_impressions')?.values.slice(-14) || [];
  const engagedUsersData = pageData?.insights.find((i) => i.name === 'page_engaged_users')?.values.slice(-14) || [];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Date', color: darkMode ? '#F3F4F6' : '#1F2A44' },
        ticks: { color: darkMode ? '#F3F4F6' : '#1F2A44' },
      },
      y: {
        title: { display: true, color: darkMode ? '#F3F4F6' : '#1F2A44' },
        ticks: { color: darkMode ? '#F3F4F6' : '#1F2A44' },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: { labels: { color: darkMode ? '#F3F4F6' : '#1F2A44' } },
      tooltip: {
        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
        titleColor: darkMode ? '#F3F4F6' : '#1F2A44',
        bodyColor: darkMode ? '#F3F4F6' : '#1F2A44',
      },
    },
  };

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
          <h1 className="text-2xl font-bold mb-6 text-textBlack dark:text-white">Facebook Analytics</h1>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 border-l-4 border-primaryRed text-primaryRed dark:text-red-200 px-4 py-3 rounded-2xl mb-6">
              {error}
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-textBlack dark:text-white">
              Connected Facebook Accounts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {facebookAccounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 relative hover:shadow-2xl hover:scale-105 transition-all duration-200"
                >
                  <h3 className="font-semibold text-lg mb-2 text-textBlack dark:text-white">
                    {account.pageName || `Page ID: ${account.pageId}`}
                  </h3>
                  <button
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`px-4 py-2 rounded-lg mb-2 ${
                      selectedAccountId === account.id
                        ? 'bg-primaryPurple text-white hover:bg-highlightBlue'
                        : 'bg-gray-200 dark:bg-gray-700 text-textBlack dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                    } transition-all duration-200`}
                    aria-label={`Select account ${account.pageName || account.pageId}`}
                  >
                    {selectedAccountId === account.id ? 'Selected' : 'Select'}
                  </button>
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    className="px-4 py-2 bg-primaryRed text-white rounded-lg hover:bg-red-600 hover:shadow-md transition-all duration-200 absolute top-2 right-2"
                    aria-label={`Disconnect account ${account.pageName || account.pageId}`}
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" className="text-primaryPurple" />
            </div>
          ) : selectedAccountId && pageData ? (
            <div className="space-y-8">
              <h2 className="text-xl font-semibold text-textBlack dark:text-white">{pageData.pageName}</h2>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-textBlack dark:text-white">Page Insights</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                    <h4 className="font-medium text-textBlack dark:text-white mb-4">Page Impressions</h4>
                    <div className="h-80">
                      <Bar
                        data={{
                          labels: impressionsData.map((item) =>
                            new Date(item.end_time).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })
                          ),
                          datasets: [
                            {
                              label: 'Impressions',
                              data: impressionsData.map((item) => item.value),
                              backgroundColor: '#3B82F6',
                              borderColor: '#1E40AF',
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          ...chartOptions,
                          scales: {
                            ...chartOptions.scales,
                            y: {
                              ...chartOptions.scales.y,
                              title: { ...chartOptions.scales.y.title, text: 'Impressions' },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                    <h4 className="font-medium text-textBlack dark:text-white mb-4">Engaged Users</h4>
                    <div className="h-80">
                      <Bar
                        data={{
                          labels: engagedUsersData.map((item) =>
                            new Date(item.end_time).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })
                          ),
                          datasets: [
                            {
                              label: 'Engaged Users',
                              data: engagedUsersData.map((item) => item.value),
                              backgroundColor: '#9C27B0',
                              borderColor: '#6B21A8',
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          ...chartOptions,
                          scales: {
                            ...chartOptions.scales,
                            y: {
                              ...chartOptions.scales.y,
                              title: { ...chartOptions.scales.y.title, text: 'Users' },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-textBlack dark:text-white">Key Metrics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Page Fans"
                    value={pageData.insights.find((i) => i.name === 'page_fans')?.values[0]?.value || 0}
                    icon="👥"
                  />
                  <MetricCard
                    title="Total Impressions"
                    value={sumValues(pageData.insights.find((i) => i.name === 'page_impressions')?.values || [])}
                    icon="👁️"
                  />
                  <MetricCard
                    title="Unique Impressions"
                    value={sumValues(
                      pageData.insights.find((i) => i.name === 'page_impressions_unique')?.values || []
                    )}
                    icon="🔍"
                  />
                  <MetricCard
                    title="Post Engagements"
                    value={sumValues(
                      pageData.insights.find((i) => i.name === 'page_post_engagements')?.values || []
                    )}
                    icon="❤️"
                  />
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-textBlack dark:text-white">Recent Posts</h3>
                {pageData.posts.length > 0 ? (
                  <div className="space-y-6">
                    {pageData.posts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-200"
                      >
                        <p className="text-textBlack dark:text-white mb-2">{post.message || '(No message)'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Posted on {new Date(post.created_time).toLocaleDateString()}
                        </p>
                        {post.insights && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">Impressions</p>
                              <p className="font-semibold text-textBlack dark:text-white">
                                {post.insights.data.find((i) => i.name === 'post_impressions')?.values[0]
                                  ?.value || 0}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">Unique Views</p>
                              <p className="font-semibold text-textBlack dark:text-white">
                                {post.insights.data.find((i) => i.name === 'post_impressions_unique')
                                  ?.values[0]?.value || 0}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                    <p className="text-gray-600 dark:text-gray-400">No recent posts found.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">Please select a Facebook account to view analytics.</p>
          )}
        </main>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  const { darkMode } = useDarkMode();
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-200">
      <div className="flex items-center mb-2">
        <span className="text-2xl mr-2">{icon}</span>
        <h4 className="font-medium text-textBlack dark:text-white">{title}</h4>
      </div>
      <p className="text-2xl font-bold text-textBlack dark:text-white">{value.toLocaleString()}</p>
    </div>
  );
}