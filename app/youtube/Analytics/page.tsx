// app/youtube/Analytics/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format, subDays } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Calendar, RefreshCw } from 'lucide-react';

// Types
type GoogleAccount = {
  id: string;
  googleEmail: string;
};

type ChannelInfo = {
  title: string;
  thumbnails: { default?: { url: string }, medium?: { url: string }, high?: { url: string } };
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
  videoDetails: any[];
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
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Fetch Google accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/google/accounts');
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setAccounts(data.accounts || []);
        
        // Select the first account by default if available
        if (data.accounts && data.accounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data.accounts[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching accounts:', err);
        setError(err.message || 'Failed to fetch accounts');
      }
    };

    if (session?.user) {
      fetchAccounts();
    }
  }, [session, selectedAccountId]);

  // Fetch analytics data when account is selected
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedAccountId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const queryParams = new URLSearchParams({
          accountId: selectedAccountId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        });
        
        const response = await fetch(`/api/youtube/analytics?${queryParams.toString()}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }
        
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    if (selectedAccountId) {
      fetchAnalytics();
    }
  }, [selectedAccountId, dateRange]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'startDate' | 'endDate') => {
    setDateRange(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleRefresh = () => {
    if (selectedAccountId) {
      // Re-fetch analytics with current settings
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        accountId: selectedAccountId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      fetch(`/api/youtube/analytics?${queryParams.toString()}`)
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              throw new Error(text || response.statusText);
            });
          }
          return response.json();
        })
        .then(data => {
          setAnalyticsData(data);
        })
        .catch(err => {
          console.error('Error refreshing analytics:', err);
          setError(err.message || 'Failed to refresh analytics data');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  // Render the analytics dashboard
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">YouTube Analytics</h1>
      </div>

      {/* Account selection and date range controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center mb-4 space-y-4 md:space-y-0 md:space-x-4">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select YouTube Account</label>
            <select 
              value={selectedAccountId} 
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select an account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.googleEmail}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-full md:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange(e, 'startDate')}
                className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="w-full md:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange(e, 'endDate')}
                className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="w-full md:w-auto mt-4 md:mt-6">
            <button
              onClick={handleRefresh}
              disabled={loading || !selectedAccountId}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {/* Analytics Dashboard */}
      {!loading && analyticsData && (
        <div className="space-y-6">
          {/* Channel Overview */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Channel Overview</h2>
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
                    <h3 className="font-bold text-lg">{analyticsData.channelInfo.title}</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Total Views</p>
                    <p className="text-2xl font-bold">
                      {Number(analyticsData.channelInfo.statistics.viewCount).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Subscribers</p>
                    <p className="text-2xl font-bold">
                      {Number(analyticsData.channelInfo.statistics.subscriberCount).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Videos</p>
                    <p className="text-2xl font-bold">
                      {Number(analyticsData.channelInfo.statistics.videoCount).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Views Graph */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Views Over Time</h2>
            <div className="h-80">
              <TimeSeriesChart 
                data={analyticsData.timeSeriesData} 
                metric="views" 
              />
            </div>
          </div>

          {/* Watch Time Graph */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Watch Time (minutes)</h2>
            <div className="h-80">
              <TimeSeriesChart 
                data={analyticsData.timeSeriesData} 
                metric="estimatedMinutesWatched" 
              />
            </div>
          </div>

          {/* Engagement (Likes, Comments) */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Engagement</h2>
            <div className="h-80">
              <EngagementChart 
                data={analyticsData.timeSeriesData} 
              />
            </div>
          </div>

          {/* Top Videos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Top Videos</h2>
            <div className="overflow-x-auto">
              <TopVideosTable data={analyticsData.topVideos} />
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Traffic Sources</h2>
            <div className="h-80">
              <TrafficSourcesChart data={analyticsData.trafficSources} />
            </div>
          </div>

          {/* Demographics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Audience Demographics</h2>
            <div className="h-80">
              {analyticsData.demographics.rows && analyticsData.demographics.rows.length > 0 ? (
                <DemographicsChart data={analyticsData.demographics} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Demographics data not available for this channel</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No account selected */}
      {!selectedAccountId && !loading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Select a YouTube Account</h2>
          <p className="text-gray-600 mb-4">
            Choose a connected YouTube account to view analytics data
          </p>
          {accounts.length === 0 && (
            <div className="mt-4">
              <p className="text-gray-600 mb-2">No YouTube accounts connected</p>
              <Link href="/dashboard/connect">
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Connect YouTube Account
                </button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Time Series Chart Component for views and watch time
const TimeSeriesChart = ({ data, metric }: { data: TimeSeriesData, metric: string }) => {
  useEffect(() => {
    if (!data || !data.rows || !data.columnHeaders) return;
    
    // Find indices for date and the requested metric
    const dateIndex = data.columnHeaders.findIndex(header => header.name === 'day');
    const metricIndex = data.columnHeaders.findIndex(header => header.name === metric);
    
    if (dateIndex === -1 || metricIndex === -1) return;
    
    // Extract data
    const chartData = data.rows.map(row => ({
      date: row[dateIndex] as string,
      value: Number(row[metricIndex])
    }));
    
    // Set up the chart using HTML
    renderTimeSeriesChart(chartData, metric);
  }, [data, metric]);

  // Function to render chart using Canvas and Chart.js concepts
  const renderTimeSeriesChart = (chartData: {date: string, value: number}[], metric: string) => {
    const container = document.getElementById(`time-series-${metric}`);
    if (!container) return;
    
    // Clear any existing content
    container.innerHTML = '';
    
    // For the standalone page, we'll create a simple representation
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Include script tag for Chart.js (in a real app, you'd include this in your HTML)
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
      // @ts-ignore - Chart would be available in the window object
      const ctx = canvas.getContext('2d');
      
      // @ts-ignore - Chart would be available in the window object
      new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: chartData.map(item => item.date),
          datasets: [{
            label: metric === 'views' ? 'Views' : 'Watch Time (minutes)',
            data: chartData.map(item => item.value),
            borderColor: metric === 'views' ? 'rgb(59, 130, 246)' : 'rgb(16, 185, 129)',
            backgroundColor: metric === 'views' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              title: {
                display: true,
                text: metric === 'views' ? 'Views' : 'Minutes'
              },
              beginAtZero: true
            }
          }
        }
      });
    };
    document.body.appendChild(script);
  };

  return <div id={`time-series-${metric}`} className="w-full h-full"></div>;
};

// Engagement Chart Component (Likes, Comments)
const EngagementChart = ({ data }: { data: TimeSeriesData }) => {
  useEffect(() => {
    if (!data || !data.rows || !data.columnHeaders) return;
    
    // Find indices for date, likes, and comments
    const dateIndex = data.columnHeaders.findIndex(header => header.name === 'day');
    const likesIndex = data.columnHeaders.findIndex(header => header.name === 'likes');
    const commentsIndex = data.columnHeaders.findIndex(header => header.name === 'comments');
    
    if (dateIndex === -1 || likesIndex === -1 || commentsIndex === -1) return;
    
    // Extract data
    const chartData = data.rows.map(row => ({
      date: row[dateIndex] as string,
      likes: Number(row[likesIndex]),
      comments: Number(row[commentsIndex])
    }));
    
    // Set up the chart using HTML
    renderEngagementChart(chartData);
  }, [data]);

  // Function to render chart using Canvas and Chart.js concepts
  const renderEngagementChart = (chartData: {date: string, likes: number, comments: number}[]) => {
    const container = document.getElementById('engagement-chart');
    if (!container) return;
    
    // Clear any existing content
    container.innerHTML = '';
    
    // For the standalone page, we'll create a simple representation
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Include script tag for Chart.js (in a real app, you'd include this in your HTML)
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
      // @ts-ignore - Chart would be available in the window object
      const ctx = canvas.getContext('2d');
      
      // @ts-ignore - Chart would be available in the window object
      new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: chartData.map(item => item.date),
          datasets: [
            {
              label: 'Likes',
              data: chartData.map(item => item.likes),
              backgroundColor: 'rgba(99, 102, 241, 0.7)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 1
            },
            {
              label: 'Comments',
              data: chartData.map(item => item.comments),
              backgroundColor: 'rgba(244, 114, 182, 0.7)',
              borderColor: 'rgb(244, 114, 182)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Count'
              },
              beginAtZero: true
            }
          }
        }
      });
    };
    document.body.appendChild(script);
  };

  return <div id="engagement-chart" className="w-full h-full"></div>;
};

// Traffic Sources Chart
const TrafficSourcesChart = ({ data }: { data: TrafficSourcesData }) => {
  useEffect(() => {
    if (!data || !data.rows || !data.columnHeaders) return;
    
    // Find indices for traffic source and views
    const sourceIndex = data.columnHeaders.findIndex(header => header.name === 'insightTrafficSourceType');
    const viewsIndex = data.columnHeaders.findIndex(header => header.name === 'views');
    
    if (sourceIndex === -1 || viewsIndex === -1) return;
    
    // Extract data
    const chartData = data.rows.map(row => ({
      source: row[sourceIndex] as string,
      views: Number(row[viewsIndex])
    }));
    
    // Set up the chart using HTML
    renderTrafficSourcesChart(chartData);
  }, [data]);

  // Function to render chart using Canvas and Chart.js concepts
  const renderTrafficSourcesChart = (chartData: {source: string, views: number}[]) => {
    const container = document.getElementById('traffic-sources-chart');
    if (!container) return;
    
    // Clear any existing content
    container.innerHTML = '';
    
    // For the standalone page, we'll create a simple representation
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Include script tag for Chart.js (in a real app, you'd include this in your HTML)
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
      // @ts-ignore - Chart would be available in the window object
      const ctx = canvas.getContext('2d');
      
      // Map traffic source names to more readable names
      const sourceLabels = chartData.map(item => {
        switch(item.source) {
          case 'EXT_URL': return 'External';
          case 'YT_SEARCH': return 'YouTube Search';
          case 'RELATED_VIDEO': return 'Related Videos';
          case 'SUBSCRIBER': return 'Subscribers';
          case 'PLAYLIST': return 'Playlists';
          case 'NOTIFICATION': return 'Notifications';
          case 'SOCIAL': return 'Social Media';
          case 'CHANNEL': return 'Channel Page';
          case 'BROWSE_FEATURES': return 'Browse Features';
          case 'DIRECT_OR_UNKNOWN': return 'Direct/Unknown';
          default: return item.source;
        }
      });
      
      // @ts-ignore - Chart would be available in the window object
      new window.Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: sourceLabels,
          datasets: [{
            data: chartData.map(item => item.views),
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)',
              'rgba(199, 199, 199, 0.7)',
              'rgba(83, 102, 255, 0.7)',
              'rgba(40, 159, 64, 0.7)',
              'rgba(210, 199, 199, 0.7)',
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 206, 86)',
              'rgb(75, 192, 192)',
              'rgb(153, 102, 255)',
              'rgb(255, 159, 64)',
              'rgb(199, 199, 199)',
              'rgb(83, 102, 255)',
              'rgb(40, 159, 64)',
              'rgb(210, 199, 199)',
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
            }
          }
        }
      });
    };
    document.body.appendChild(script);
  };

  return <div id="traffic-sources-chart" className="w-full h-full"></div>;
};

// Demographics Chart
const DemographicsChart = ({ data }: { data: DemographicsData }) => {
  useEffect(() => {
    if (!data || !data.rows || !data.columnHeaders) return;
    
    // Find indices for age group, gender, and percentage
    const ageIndex = data.columnHeaders.findIndex(header => header.name === 'ageGroup');
    const genderIndex = data.columnHeaders.findIndex(header => header.name === 'gender');
    const percentageIndex = data.columnHeaders.findIndex(header => header.name === 'viewerPercentage');
    
    if (ageIndex === -1 || genderIndex === -1 || percentageIndex === -1) return;
    
    // Extract and organize data
    const maleData: Record<string, number> = {};
    const femaleData: Record<string, number> = {};
    
    data.rows.forEach(row => {
      const age = row[ageIndex] as string;
      const gender = row[genderIndex] as string;
      const percentage = Number(row[percentageIndex]);
      
      if (gender === 'FEMALE') {
        femaleData[age] = percentage;
      } else if (gender === 'MALE') {
        maleData[age] = percentage;
      }
    });
    
    // Set up the chart using HTML
    renderDemographicsChart(maleData, femaleData);
  }, [data]);

  // Function to render chart using Canvas and Chart.js concepts
  const renderDemographicsChart = (maleData: Record<string, number>, femaleData: Record<string, number>) => {
    const container = document.getElementById('demographics-chart');
    if (!container) return;
    
    // Clear any existing content
    container.innerHTML = '';
    
    // For the standalone page, we'll create a simple representation
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Include script tag for Chart.js (in a real app, you'd include this in your HTML)
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
      // @ts-ignore - Chart would be available in the window object
      const ctx = canvas.getContext('2d');
      
      // Get all age groups and sort them in order
      const allAgeGroups = Array.from(
        new Set([...Object.keys(maleData), ...Object.keys(femaleData)])
      ).sort((a, b) => {
        const ageA = a.replace('AGE_', '');
        const ageB = b.replace('AGE_', '');
        return ageA.localeCompare(ageB);
      });
      
      // Map age group codes to readable labels
      const ageLabels = allAgeGroups.map(age => {
        switch(age) {
          case 'AGE_13_17': return '13-17';
          case 'AGE_18_24': return '18-24';
          case 'AGE_25_34': return '25-34';
          case 'AGE_35_44': return '35-44';
          case 'AGE_45_54': return '45-54';
          case 'AGE_55_64': return '55-64';
          case 'AGE_65_': return '65+';
          default: return age;
        }
      });
      
      // @ts-ignore - Chart would be available in the window object
      new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: ageLabels,
          datasets: [
            {
              label: 'Male',
              data: allAgeGroups.map(age => maleData[age] || 0),
              backgroundColor: 'rgba(54, 162, 235, 0.7)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1
            },
            {
              label: 'Female',
              data: allAgeGroups.map(age => femaleData[age] || 0),
              backgroundColor: 'rgba(255, 99, 132, 0.7)',
              borderColor: 'rgb(255, 99, 132)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Age Group'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Percentage (%)'
              },
              beginAtZero: true
            }
          }
        }
      });
    };
    document.body.appendChild(script);
  };

  return <div id="demographics-chart" className="w-full h-full"></div>;
};

// Top Videos Table
const TopVideosTable = ({ data }: { data: TopVideosData }) => {
  // Find indices for video ID, views, watch time, likes, and comments
  const videoIndex = data.headers ? data.headers.findIndex(header => header.name === 'video') : -1;
  const viewsIndex = data.headers ? data.headers.findIndex(header => header.name === 'views') : -1;
  const watchTimeIndex = data.headers ? data.headers.findIndex(header => header.name === 'estimatedMinutesWatched') : -1;
  const likesIndex = data.headers ? data.headers.findIndex(header => header.name === 'likes') : -1;
  const commentsIndex = data.headers ? data.headers.findIndex(header => header.name === 'comments') : -1;

  if (videoIndex === -1 || viewsIndex === -1 || !data.rows || data.rows.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No video data available</p>
      </div>
    );
  }

  // Helper function to find video details by ID
  const getVideoDetails = (videoId: string) => {
    if (!data.videoDetails) return null;
    return data.videoDetails.find(video => video.id === videoId);
  };

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Video
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Views
          </th>
          {watchTimeIndex !== -1 && (
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Watch Time (min)
            </th>
          )}
          {likesIndex !== -1 && (
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Likes
            </th>
          )}
          {commentsIndex !== -1 && (
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Comments
            </th>
          )}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.rows.map((row, index) => {
          const videoId = row[videoIndex] as string;
          const videoDetails = getVideoDetails(videoId);
          
          return (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {videoDetails && videoDetails.snippet?.thumbnails?.default?.url && (
                    <img 
                      src={videoDetails.snippet.thumbnails.default.url} 
                      alt="Video thumbnail" 
                      className="h-10 w-16 object-cover mr-3"
                    />
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {videoDetails ? videoDetails.snippet?.title : videoId}
                    </div>
                    <div className="text-sm text-gray-500">
                      <a 
                        href={`https://www.youtube.com/watch?v=${videoId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        View on YouTube
                      </a>
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {Number(row[viewsIndex]).toLocaleString()}
              </td>
              {watchTimeIndex !== -1 && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {Number(row[watchTimeIndex]).toLocaleString()}
                </td>
              )}
              {likesIndex !== -1 && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {Number(row[likesIndex]).toLocaleString()}
                </td>
              )}
              {commentsIndex !== -1 && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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