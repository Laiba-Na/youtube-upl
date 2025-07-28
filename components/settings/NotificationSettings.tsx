'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDarkMode } from '@/app/DarkModeContext';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function NotificationSettings() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const [postReminders, setPostReminders] = useState(true);
  const [analyticsEmails, setAnalyticsEmails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSettings();
    }
  }, [session]);

  const fetchSettings = async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/user/settings', { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch settings: ${response.statusText}`);
      }
      const data = await response.json();
      setPostReminders(data.emailNotifications ?? true);
      setAnalyticsEmails(data.analyticsEmails ?? false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notification settings';
      toast.error(errorMessage);
    } finally {
      setIsFetching(false);
    }
  };

  // Schedule weekly analytics email check for Sunday 9:00 AM PKT
  useEffect(() => {
    if (!session?.user?.id || !analyticsEmails) return;

    const checkAnalyticsEmail = async () => {
      const now = new Date();
      const pktTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
      const isSunday = pktTime.getDay() === 0;
      const isNineAM = pktTime.getHours() === 9 && pktTime.getMinutes() === 0;

      if (isSunday && isNineAM) {
        try {
          const response = await fetch('/api/email/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to trigger analytics email');
          }
        } catch (err) {
          console.error('Analytics email trigger error:', err instanceof Error ? err.message : err);
        }
      }
    };

    const intervalId = setInterval(checkAnalyticsEmail, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [session, analyticsEmails]);

  const handleSave = async () => {
    if (!session?.user?.id) {
      toast.error('Please log in to save settings');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailNotifications: postReminders,
          analyticsEmails,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save settings: ${response.statusText}`);
      }

      toast.success('Notification settings saved successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-textBlack dark:text-white">
        Notification Settings
      </h2>
      {isFetching ? (
        <div className="flex justify-center">
          <LoadingSpinner size="lg" className="text-primaryPurple" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-300 dark:border-gray-600">
            <div>
              <p className="font-medium text-textBlack dark:text-white">Post Reminders</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive email reminders 1 hour before a scheduled post
              </p>
            </div>
            <button
              onClick={() => setPostReminders(!postReminders)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                postReminders ? 'bg-primaryPurple' : 'bg-gray-200 dark:bg-gray-600'
              }`}
              aria-label={postReminders ? 'Disable post reminders' : 'Enable post reminders'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  postReminders ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-300 dark:border-gray-600">
            <div>
              <p className="font-medium text-textBlack dark:text-white">Weekly Analytics Emails</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive weekly analytics summary via email
              </p>
            </div>
            <button
              onClick={() => setAnalyticsEmails(!analyticsEmails)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                analyticsEmails ? 'bg-primaryPurple' : 'bg-gray-200 dark:bg-gray-600'
              }`}
              aria-label={analyticsEmails ? 'Disable analytics emails' : 'Enable analytics emails'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  analyticsEmails ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200 disabled:bg-gray-400"
              aria-label="Save notification settings"
            >
              {loading ? (
                <span className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2 text-white" />
                  Saving...
                </span>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}