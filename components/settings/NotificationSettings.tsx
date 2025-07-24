"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDarkMode } from "@/app/DarkModeContext";
import toast from "react-hot-toast";

export default function NotificationSettings() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const [postReminders, setPostReminders] = useState(true);
  const [analyticsEmails, setAnalyticsEmails] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSettings();
    }
  }, [session]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/user/settings");
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Fetch settings error:", errorData);
        throw new Error(
          errorData.error || `Failed to fetch settings: ${response.statusText}`
        );
      }
      const data = await response.json();
      setPostReminders(data.emailNotifications ?? true);
      setAnalyticsEmails(data.analyticsEmails ?? false);
    } catch (error: any) {
      console.error("Fetch settings error:", error.message);
      toast.error(error.message || "Failed to load notification settings");
    }
  };

  // Schedule weekly analytics email check for Sunday 9:00 AM PKT
  useEffect(() => {
    if (!session?.user?.id || !analyticsEmails) return;

    const checkAnalyticsEmail = async () => {
      const now = new Date();
      // Convert to Asia/Karachi (PKT, UTC+05:00)
      const pktTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Karachi" })
      );
      const isSunday = pktTime.getDay() === 0; // Sunday = 0
      const isNineAM = pktTime.getHours() === 9 && pktTime.getMinutes() === 0;

      if (isSunday && isNineAM) {
        try {
          const response = await fetch("/api/email/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if (!response.ok) {
            const errorData = await response.json();
            console.error("Analytics email trigger error:", errorData);
            throw new Error(
              errorData.error || "Failed to trigger analytics email"
            );
          }
          console.log("Analytics email triggered successfully");
        } catch (error: any) {
          console.error("Analytics email trigger error:", error.message);
        }
      }
    };

    // Check every minute
    const intervalId = setInterval(checkAnalyticsEmail, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [session, analyticsEmails]);

  const handleSave = async () => {
    if (!session?.user?.id) {
      toast.error("Please log in to save settings");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications: postReminders,
          analyticsEmails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Save settings error:", errorData);
        throw new Error(
          errorData.error || `Failed to save settings: ${response.statusText}`
        );
      }

      toast.success("Notification settings saved successfully!");
    } catch (error: any) {
      console.error("Save settings error:", error.message);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        Notification Settings
      </h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-300 dark:border-gray-700">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Post Reminders
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive email reminders 1 hour before a scheduled post
            </p>
          </div>
          <button
            onClick={() => setPostReminders(!postReminders)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              postReminders ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                postReminders ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-300 dark:border-gray-700">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Weekly Analytics Emails
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive weekly analytics summary via email
            </p>
          </div>
          <button
            onClick={() => setAnalyticsEmails(!analyticsEmails)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              analyticsEmails ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                analyticsEmails ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition disabled:bg-indigo-400"
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
