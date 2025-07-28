"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import MiniCircularProgress from '@/components/MiniCircularProgress';
import Sidebar from '@/components/sideBar';
import WeeklySchedule from '@/components/WeeklySchedule';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import imageGradient from '../round.jpg';
import TopBar from '@/components/TopBar';
import Link from 'next/link';
import { useDarkMode } from '@/app/DarkModeContext';
import { SocialPost } from '@prisma/client';
import { format, subDays, addDays } from 'date-fns';
import { Menu } from 'lucide-react';

interface AnalyticsDataPoint {
  date: string;
  youtubeViews: number;
  facebookImpressions: number;
}

const PostEditing = () => {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataPoint[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'facebook' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Memoized fetch functions to prevent re-creation
  const fetchAnalytics = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch YouTube analytics
      const youtubeResponse = await fetch(
        `/api/youtube/analytics?accountId=${session.user.googleAccounts?.[0]?.id || ''}&startDate=${format(subDays(new Date(), 7), 'yyyy-MM-dd')}&endDate=${format(new Date(), 'yyyy-MM-dd')}`
      );
      const youtubeData = youtubeResponse.ok ? await youtubeResponse.json() : { timeSeriesData: { rows: [] } };

      // Fetch Facebook analytics
      const facebookResponse = await fetch(
        `/api/facebook/insights?facebookAccountId=${session.user.facebookAccounts?.[0]?.id || ''}`
      );
      const facebookData = facebookResponse.ok ? await facebookResponse.json() : { insights: [] };

      // Combine data
      const weekDays = Array.from({ length: 7 }, (_, i) => format(addDays(subDays(new Date(), 7), i), 'yyyy-MM-dd'));
      const combinedData: AnalyticsDataPoint[] = weekDays.map((date) => {
        const youtubeRow = youtubeData.timeSeriesData.rows?.find(
          (row: any[]) => row[0] === date
        );
        const facebookInsight = facebookData.insights?.find(
          (i: any) => i.name === 'page_impressions'
        )?.values.find((v: any) => v.end_time.startsWith(date));

        return {
          date,
          youtubeViews: youtubeRow ? Number(youtubeRow[1]) : 0,
          facebookImpressions: facebookInsight ? Number(facebookInsight.value) : 0,
        };
      });

      setAnalyticsData(combinedData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [session]);

  const fetchPosts = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch('/api/calendar/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(data.filter((post: SocialPost) => post.scheduledAt));
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to fetch posts');
    }
  }, [session]);

  // Fetch data on mount or when session changes
  useEffect(() => {
    fetchAnalytics();
    fetchPosts();
  }, [fetchAnalytics, fetchPosts]);

  // Memoized chart data based on selected platform
  const chartData = useMemo(() => {
    if (!selectedPlatform) {
      return analyticsData;
    }
    return analyticsData.map((data) => ({
      date: data.date,
      [selectedPlatform === 'youtube' ? 'youtubeViews' : 'facebookImpressions']:
        selectedPlatform === 'youtube' ? data.youtubeViews : data.facebookImpressions,
    }));
  }, [analyticsData, selectedPlatform]);

  // Calculate totals for circles
  const youtubeTotal = useMemo(
    () => analyticsData.reduce((sum, d) => sum + d.youtubeViews, 0),
    [analyticsData]
  );
  const facebookTotal = useMemo(
    () => analyticsData.reduce((sum, d) => sum + d.facebookImpressions, 0),
    [analyticsData]
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <TopBar />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Mobile Sidebar Toggle */}
        <button
          className={`lg:hidden fixed top-4 right-4 z-50 p-2 text-white bg-primaryPurple rounded-full hover:bg-highlightBlue transition-all duration-200 ${isSidebarOpen ? 'hidden' : 'block'}`}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-primaryRed text-primaryRed dark:text-red-400 px-4 py-3 mb-6 rounded-lg animate-shake">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-12 w-12 text-primaryPurple" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Graph and Mini Circles */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-textBlack dark:text-white mb-4">
                  Social Media Analytics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1 flex flex-col space-y-4">
                    <MiniCircularProgress
                      value={youtubeTotal}
                      maxValue={10000}
                      platform="youtube"
                      isSelected={selectedPlatform === 'youtube'}
                      onClick={() => setSelectedPlatform(selectedPlatform === 'youtube' ? null : 'youtube')}
                    />
                    <MiniCircularProgress
                      value={facebookTotal}
                      maxValue={10000}
                      platform="facebook"
                      isSelected={selectedPlatform === 'facebook'}
                      onClick={() => setSelectedPlatform(selectedPlatform === 'facebook' ? null : 'facebook')}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            value.toLocaleString(),
                            name === 'youtubeViews' ? 'YouTube Views' : 'Facebook Impressions',
                          ]}
                        />
                        {(!selectedPlatform || selectedPlatform === 'youtube') && (
                          <Line
                            type="monotone"
                            dataKey="youtubeViews"
                            stroke="#E63946"
                            strokeWidth={3}
                            name="YouTube Views"
                          />
                        )}
                        {(!selectedPlatform || selectedPlatform === 'facebook') && (
                          <Line
                            type="monotone"
                            dataKey="facebookImpressions"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            name="Facebook Impressions"
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Weekly Schedule */}
              <div className="lg:col-span-1">
                <WeeklySchedule posts={posts} />
              </div>

              {/* Gradient Image with Tooltip */}
              <div className="lg:col-span-3 flex justify-center">
                <div className="w-80 relative group hover:scale-105 hover:rotate-45 duration-700 transition-all ease-in-out">
                  <Link href="/SocialMediaAssistance"  aria-label="Ask Social Media Assistance for a new post idea">
                    <img src={imageGradient.src} alt="Round graphic" className="object-cover rounded-lg" />
                  </Link>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-primaryPurple dark:bg-gray-800 text-white dark:text-gray-200 text-sm font-medium px-3 py-2 rounded-lg shadow-md transition-opacity duration-200 z-10">
                    Ask Social Media Assistance for a new post idea
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PostEditing;