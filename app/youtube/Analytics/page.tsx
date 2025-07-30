"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDarkMode } from "@/app/DarkModeContext";
import { format, subDays } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Calendar, RefreshCw, Menu } from "lucide-react";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/sideBar";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type GoogleAccount = {
  id: string;
  googleEmail: string;
};

type ChannelInfo = {
  title: string;
  thumbnails: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    videoCount: string;
  };
};

type TimeSeriesData = {
  columnHeaders: { name: string; columnType: string; dataType: string }[];
  rows: (string | number)[][];
};

type TopVideosData = {
  headers: { name: string; columnType: string; dataType: string }[];
  rows: (string | number)[][];
  videoDetails: {
    id: string;
    snippet?: { title?: string; thumbnails?: { default?: { url: string } } };
  }[];
};

type DemographicsData = {
  columnHeaders: { name: string; columnType: string; dataType: string }[];
  rows: (string | number)[][];
};

type TrafficSourcesData = {
  columnHeaders: { name: string; columnType: string; dataType: string }[];
  rows: (string | number)[][];
};

type AnalyticsData = {
  channelInfo: ChannelInfo;
  timeSeriesData: TimeSeriesData;
  topVideos: TopVideosData;
  demographics: DemographicsData;
  trafficSources: TrafficSourcesData;
  dateRange: {
    startDate: string;
    endDate: string;
  };
};

const YoutubeAnalytics = () => {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch("/api/google/accounts");
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data: { accounts?: GoogleAccount[] } = await response.json();
        setAccounts(data.accounts || []);
        if (data.accounts && data.accounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data.accounts[0].id);
        }
      } catch (err: unknown) {
        console.error("Error fetching accounts:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch accounts"
        );
      }
    };

    if (session?.user) {
      fetchAccounts();
    }
  }, [session, selectedAccountId]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedAccountId) return;

      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          accountId: selectedAccountId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });

        const response = await fetch(
          `/api/youtube/analytics?${queryParams.toString()}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }

        const data: AnalyticsData = await response.json();
        setAnalyticsData(data);
      } catch (err: unknown) {
        console.error("Error fetching analytics:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch analytics data"
        );
      } finally {
        setLoading(false);
      }
    };

    if (selectedAccountId) {
      fetchAnalytics();
    }
  }, [selectedAccountId, dateRange]);

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "startDate" | "endDate"
  ) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleRefresh = () => {
    if (selectedAccountId) {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        accountId: selectedAccountId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      fetch(`/api/youtube/analytics?${queryParams.toString()}`)
        .then((response) => {
          if (!response.ok) {
            return response.text().then((text) => {
              throw new Error(text || response.statusText);
            });
          }
          return response.json();
        })
        .then((data: AnalyticsData) => {
          setAnalyticsData(data);
        })
        .catch((err: unknown) => {
          console.error("Error refreshing analytics:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to refresh analytics data"
          );
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
          color: darkMode ? "#F3F4F6" : "#1F2A44",
        },
        ticks: { color: darkMode ? "#F3F4F6" : "#1F2A44" },
      },
      y: {
        title: { display: true, color: darkMode ? "#F3F4F6" : "#1F2A44" },
        ticks: { color: darkMode ? "#F3F4F6" : "#1F2A44" },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: { labels: { color: darkMode ? "#F3F4F6" : "#1F2A44" } },
      tooltip: {
        backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
        titleColor: darkMode ? "#F3F4F6" : "#1F2A44",
        bodyColor: darkMode ? "#F3F4F6" : "#1F2A44",
      },
    },
  };

  const viewsData =
    analyticsData?.timeSeriesData.rows.map((row) => ({
      date: row[
        analyticsData.timeSeriesData.columnHeaders.findIndex(
          (header) => header.name === "day"
        )
      ] as string,
      value: Number(
        row[
          analyticsData.timeSeriesData.columnHeaders.findIndex(
            (header) => header.name === "views"
          )
        ]
      ),
    })) || [];

  const watchTimeData =
    analyticsData?.timeSeriesData.rows.map((row) => ({
      date: row[
        analyticsData.timeSeriesData.columnHeaders.findIndex(
          (header) => header.name === "day"
        )
      ] as string,
      value: Number(
        row[
          analyticsData.timeSeriesData.columnHeaders.findIndex(
            (header) => header.name === "estimatedMinutesWatched"
          )
        ]
      ),
    })) || [];

  const engagementData =
    analyticsData?.timeSeriesData.rows.map((row) => ({
      date: row[
        analyticsData.timeSeriesData.columnHeaders.findIndex(
          (header) => header.name === "day"
        )
      ] as string,
      likes: Number(
        row[
          analyticsData.timeSeriesData.columnHeaders.findIndex(
            (header) => header.name === "likes"
          )
        ]
      ),
      comments: Number(
        row[
          analyticsData.timeSeriesData.columnHeaders.findIndex(
            (header) => header.name === "comments"
          )
        ]
      ),
    })) || [];

  const trafficSourcesData =
    analyticsData?.trafficSources.rows.map((row) => ({
      source: row[
        analyticsData.trafficSources.columnHeaders.findIndex(
          (header) => header.name === "insightTrafficSourceType"
        )
      ] as string,
      views: Number(
        row[
          analyticsData.trafficSources.columnHeaders.findIndex(
            (header) => header.name === "views"
          )
        ]
      ),
    })) || [];

  const demographicsData =
    analyticsData?.demographics.rows.reduce(
      (acc: { age: string; male: number; female: number }[], row) => {
        const age = row[
          analyticsData.demographics.columnHeaders.findIndex(
            (header) => header.name === "ageGroup"
          )
        ] as string;
        const gender = row[
          analyticsData.demographics.columnHeaders.findIndex(
            (header) => header.name === "gender"
          )
        ] as string;
        const percentage = Number(
          row[
            analyticsData.demographics.columnHeaders.findIndex(
              (header) => header.name === "viewerPercentage"
            )
          ]
        );
        const existing = acc.find((item) => item.age === age);
        if (existing) {
          if (gender === "MALE") existing.male = percentage;
          else if (gender === "FEMALE") existing.female = percentage;
        } else {
          acc.push({
            age,
            male: gender === "MALE" ? percentage : 0,
            female: gender === "FEMALE" ? percentage : 0,
          });
        }
        return acc;
      },
      []
    ) || [];

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      } transition-colors duration-300`}
    >
      <TopBar />
      <div className="flex">
        <Sidebar
          isMobileOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <button
          className={`lg:hidden fixed top-4 right-4 z-50 p-2 text-white bg-primaryPurple rounded-full hover:bg-highlightBlue transition-all duration-200 ${
            isSidebarOpen ? "hidden" : "block"
          }`}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <main className="flex-1 p-6 lg:p-8">
          <div className="flex items-center mb-6">
            <Link
              href="/analytics"
              className="mr-4 text-highlightBlue hover:underline"
              aria-label="Back to Analytics"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-textBlack dark:text-white">
              YouTube Analytics
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center mb-4 space-y-4 md:space-y-0 md:space-x-4">
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium text-textBlack dark:text-gray-200 mb-1">
                  Select YouTube Account
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-textBlack dark:text-white focus:ring-2 focus:ring-highlightBlue transition-all duration-200"
                  aria-label="Select YouTube account"
                >
                  <option value="">Select an account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.googleEmail}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-1/4">
                <label className="block text-sm font-medium text-textBlack dark:text-gray-200 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateChange(e, "startDate")}
                    className="block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-textBlack dark:text-white focus:ring-2 focus:ring-highlightBlue transition-all duration-200"
                    aria-label="Start date"
                  />
                </div>
              </div>

              <div className="w-full md:w-1/4">
                <label className="block text-sm font-medium text-textBlack dark:text-gray-200 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateChange(e, "endDate")}
                    className="block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-textBlack dark:text-white focus:ring-2 focus:ring-highlightBlue transition-all duration-200"
                    aria-label="End date"
                  />
                </div>
              </div>

              <div className="w-full md:w-auto mt-4 md:mt-6">
                <button
                  onClick={handleRefresh}
                  disabled={loading || !selectedAccountId}
                  className="inline-flex items-center px-4 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200 disabled:opacity-50"
                  aria-label="Refresh analytics"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 border-l-4 border-primaryRed text-primaryRed dark:text-red-200 px-4 py-3 rounded-2xl mb-6">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" className="text-primaryPurple" />
            </div>
          )}

          {!loading && analyticsData && (
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-textBlack dark:text-white">
                  Channel Overview
                </h2>
                <div className="flex flex-col md:flex-row">
                  <div className="flex items-center mb-4 md:mb-0 md:mr-8">
                    {analyticsData.channelInfo.thumbnails?.default?.url && (
                      <img
                        src={analyticsData.channelInfo.thumbnails.default.url}
                        alt="Channel thumbnail"
                        className="w-16 h-16 rounded-full mr-4"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-textBlack dark:text-white">
                        {analyticsData.channelInfo.title}
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Views
                      </p>
                      <p className="text-2xl font-bold text-textBlack dark:text-white">
                        {Number(
                          analyticsData.channelInfo.statistics.viewCount
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Subscribers
                      </p>
                      <p className="text-2xl font-bold text-textBlack dark:text-white">
                        {Number(
                          analyticsData.channelInfo.statistics.subscriberCount
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Videos
                      </p>
                      <p className="text-2xl font-bold text-textBlack dark:text-white">
                        {Number(
                          analyticsData.channelInfo.statistics.videoCount
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-textBlack dark:text-white">
                  Views Over Time
                </h2>
                <div className="h-80">
                  <Line
                    data={{
                      labels: viewsData.map((item) => item.date),
                      datasets: [
                        {
                          label: "Views",
                          data: viewsData.map((item) => item.value),
                          borderColor: "#3B82F6",
                          backgroundColor: "rgba(59, 130, 246, 0.1)",
                          fill: true,
                          tension: 0.3,
                        },
                      ],
                    }}
                    options={{
                      ...chartOptions,
                      scales: {
                        ...chartOptions.scales,
                        y: {
                          ...chartOptions.scales.y,
                          title: {
                            ...chartOptions.scales.y.title,
                            text: "Views",
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-textBlack dark:text-white">
                  Watch Time (minutes)
                </h2>
                <div className="h-80">
                  <Line
                    data={{
                      labels: watchTimeData.map((item) => item.date),
                      datasets: [
                        {
                          label: "Watch Time (minutes)",
                          data: watchTimeData.map((item) => item.value),
                          borderColor: "#9C27B0",
                          backgroundColor: "rgba(156, 39, 176, 0.1)",
                          fill: true,
                          tension: 0.3,
                        },
                      ],
                    }}
                    options={{
                      ...chartOptions,
                      scales: {
                        ...chartOptions.scales,
                        y: {
                          ...chartOptions.scales.y,
                          title: {
                            ...chartOptions.scales.y.title,
                            text: "Minutes",
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-textBlack dark:text-white">
                  Engagement
                </h2>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: engagementData.map((item) => item.date),
                      datasets: [
                        {
                          label: "Likes",
                          data: engagementData.map((item) => item.likes),
                          backgroundColor: "#3B82F6",
                          borderColor: "#1E40AF",
                          borderWidth: 1,
                        },
                        {
                          label: "Comments",
                          data: engagementData.map((item) => item.comments),
                          backgroundColor: "#9C27B0",
                          borderColor: "#6B21A8",
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
                          title: {
                            ...chartOptions.scales.y.title,
                            text: "Count",
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-textBlack dark:text-white">
                  Top Videos
                </h2>
                <div className="overflow-x-auto">
                  <TopVideosTable data={analyticsData.topVideos} />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-textBlack dark:text-white">
                  Traffic Sources
                </h2>
                <div className="h-80">
                  <Doughnut
                    data={{
                      labels: trafficSourcesData.map((item) => {
                        switch (item.source) {
                          case "EXT_URL":
                            return "External";
                          case "YT_SEARCH":
                            return "YouTube Search";
                          case "RELATED_VIDEO":
                            return "Related Videos";
                          case "SUBSCRIBER":
                            return "Subscribers";
                          case "PLAYLIST":
                            return "Playlists";
                          case "NOTIFICATION":
                            return "Notifications";
                          case "SOCIAL":
                            return "Social Media";
                          case "CHANNEL":
                            return "Channel Page";
                          case "BROWSE_FEATURES":
                            return "Browse Features";
                          case "DIRECT_OR_UNKNOWN":
                            return "Direct/Unknown";
                          default:
                            return item.source;
                        }
                      }),
                      datasets: [
                        {
                          data: trafficSourcesData.map((item) => item.views),
                          backgroundColor: [
                            "#E63946",
                            "#3B82F6",
                            "#9C27B0",
                            "#FBBF24",
                            "#6B7280",
                            "#10B981",
                            "#F87171",
                            "#60A5FA",
                            "#A855F7",
                            "#F4B400",
                          ],
                          borderColor: [
                            "#B91C1C",
                            "#1E40AF",
                            "#6B21A8",
                            "#D97706",
                            "#4B5563",
                            "#059669",
                            "#B91C1C",
                            "#1E40AF",
                            "#6B21A8",
                            "#D97706",
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "right",
                          labels: { color: darkMode ? "#F3F4F6" : "#1F2A44" },
                        },
                        tooltip: {
                          backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                          titleColor: darkMode ? "#F3F4F6" : "#1F2A44",
                          bodyColor: darkMode ? "#F3F4F6" : "#1F2A44",
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-textBlack dark:text-white">
                  Audience Demographics
                </h2>
                <div className="h-80">
                  {analyticsData.demographics.rows &&
                  analyticsData.demographics.rows.length > 0 ? (
                    <Bar
                      data={{
                        labels: demographicsData
                          .map((item) => item.age)
                          .sort((a, b) =>
                            a
                              .replace("AGE_", "")
                              .localeCompare(b.replace("AGE_", ""))
                          )
                          .map((age) => {
                            switch (age) {
                              case "AGE_13_17":
                                return "13-17";
                              case "AGE_18_24":
                                return "18-24";
                              case "AGE_25_34":
                                return "25-34";
                              case "AGE_35_44":
                                return "35-44";
                              case "AGE_45_54":
                                return "45-54";
                              case "AGE_55_64":
                                return "55-64";
                              case "AGE_65_":
                                return "65+";
                              default:
                                return age;
                            }
                          }),
                        datasets: [
                          {
                            label: "Male",
                            data: demographicsData
                              .sort((a, b) =>
                                a.age
                                  .replace("AGE_", "")
                                  .localeCompare(b.age.replace("AGE_", ""))
                              )
                              .map((item) => item.male),
                            backgroundColor: "#3B82F6",
                            borderColor: "#1E40AF",
                            borderWidth: 1,
                          },
                          {
                            label: "Female",
                            data: demographicsData
                              .sort((a, b) =>
                                a.age
                                  .replace("AGE_", "")
                                  .localeCompare(b.age.replace("AGE_", ""))
                              )
                              .map((item) => item.female),
                            backgroundColor: "#E63946",
                            borderColor: "#B91C1C",
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        ...chartOptions,
                        scales: {
                          ...chartOptions.scales,
                          x: {
                            ...chartOptions.scales.x,
                            title: {
                              ...chartOptions.scales.x.title,
                              text: "Age Group",
                            },
                          },
                          y: {
                            ...chartOptions.scales.y,
                            title: {
                              ...chartOptions.scales.y.title,
                              text: "Percentage (%)",
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 dark:text-gray-400">
                        Demographics data not available for this channel
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!selectedAccountId && !loading && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
              <h2 className="text-xl font-semibold mb-2 text-textBlack dark:text-white">
                Select a YouTube Account
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Choose a connected YouTube account to view analytics data
              </p>
              {accounts.length === 0 && (
                <div className="mt-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    No YouTube accounts connected
                  </p>
                  <Link href="/connect-google">
                    <button
                      className="inline-flex items-center px-4 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200"
                      aria-label="Connect YouTube account"
                    >
                      Connect YouTube Account
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const TopVideosTable = ({ data }: { data: TopVideosData }) => {
  const { darkMode } = useDarkMode();
  const videoIndex = data.headers
    ? data.headers.findIndex((header) => header.name === "video")
    : -1;
  const viewsIndex = data.headers
    ? data.headers.findIndex((header) => header.name === "views")
    : -1;
  const watchTimeIndex = data.headers
    ? data.headers.findIndex(
        (header) => header.name === "estimatedMinutesWatched"
      )
    : -1;
  const likesIndex = data.headers
    ? data.headers.findIndex((header) => header.name === "likes")
    : -1;
  const commentsIndex = data.headers
    ? data.headers.findIndex((header) => header.name === "comments")
    : -1;

  if (
    videoIndex === -1 ||
    viewsIndex === -1 ||
    !data.rows ||
    data.rows.length === 0
  ) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No video data available
        </p>
      </div>
    );
  }

  const getVideoDetails = (videoId: string) => {
    return data.videoDetails?.find((video) => video.id === videoId) || null;
  };

  return (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
          >
            Video
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
          >
            Views
          </th>
          {watchTimeIndex !== -1 && (
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Watch Time (min)
            </th>
          )}
          {likesIndex !== -1 && (
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Likes
            </th>
          )}
          {commentsIndex !== -1 && (
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Comments
            </th>
          )}
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
        {data.rows.map((row, index) => {
          const videoId = row[videoIndex] as string;
          const videoDetails = getVideoDetails(videoId);

          return (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {videoDetails &&
                    videoDetails.snippet?.thumbnails?.default?.url && (
                      <img
                        src={videoDetails.snippet.thumbnails.default.url}
                        alt="Video thumbnail"
                        className="h-10 w-16 object-cover mr-3"
                      />
                    )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-textBlack dark:text-white">
                      {videoDetails ? videoDetails.snippet?.title : videoId}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <a
                        href={`https://www.youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-highlightBlue hover:underline"
                        aria-label={`View video ${
                          videoDetails?.snippet?.title || videoId
                        } on YouTube`}
                      >
                        View on YouTube
                      </a>
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-textBlack dark:text-white">
                {Number(row[viewsIndex]).toLocaleString()}
              </td>
              {watchTimeIndex !== -1 && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-textBlack dark:text-white">
                  {Number(row[watchTimeIndex]).toLocaleString()}
                </td>
              )}
              {likesIndex !== -1 && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-textBlack dark:text-white">
                  {Number(row[likesIndex]).toLocaleString()}
                </td>
              )}
              {commentsIndex !== -1 && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-textBlack dark:text-white">
                  {Number(row[commentsIndex]).toLocaleString()}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default YoutubeAnalytics;
