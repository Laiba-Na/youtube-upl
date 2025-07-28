"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDarkMode } from "@/app/DarkModeContext";
import toast from "react-hot-toast";

export default function ProfileSettings() {
  const { data: session } = useSession();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [timezone, setTimezone] = useState(
    "(UTC+05:00) Pakistan Standard Time"
  );
  const [profileImage, setProfileImage] = useState("/default-profile.png");
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
      setName(data.name || "");
      setEmail(data.email || "");
      setEmailNotifications(data.emailNotifications ?? true);
      setTimezone(data.timezone || "(UTC+05:00) Pakistan Standard Time");
      setProfileImage(data.profileImage || "/default-profile.png");
      if (data.darkMode !== undefined && data.darkMode !== darkMode) {
        console.log("Syncing dark mode from backend:", data.darkMode);
        toggleDarkMode();
      }
    } catch (error: any) {
      console.error("Fetch settings error:", error.message);
      toast.error(error.message || "Failed to load settings");
    }
  };

  const handleProfileImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Image upload error:", errorData);
        throw new Error(errorData.error || "Failed to upload image");
      }
      const { url } = await response.json();
      setProfileImage(url);
    } catch (error: any) {
      console.error("Image upload error:", error.message);
      toast.error(error.message || "Failed to upload profile image");
    }
  };

  const saveSettings = async () => {
    if (!session?.user?.id) {
      toast.error("Please log in to save settings");
      return;
    }

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email format");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          emailNotifications,
          timezone,
          profileImage,
          darkMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Save settings error:", errorData);
        throw new Error(
          errorData.error || `Failed to save settings: ${response.statusText}`
        );
      }

      toast.success("Settings saved successfully!");
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
        Profile Settings
      </h2>

      {/* Profile Section */}
      <section className="mb-8">
        <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">
          Profile
        </h3>
        <div className="flex items-center space-x-6">
          <div>
            <img
              src={profileImage}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border border-gray-300 dark:border-gray-700"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {email}
            </p>
          </div>
          <div>
            <input
              type="file"
              id="profile-upload"
              accept="image/*"
              className="hidden"
              onChange={handleProfileImageChange}
            />
            <button
              onClick={() => document.getElementById("profile-upload")?.click()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition"
            >
              Change
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              JPG, PNG, or GIF. Max size of 2MB
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="mb-8">
        <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">
          Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-300 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Dark Mode
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Switch between light and dark theme
              </p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  darkMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-300 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Email Notifications
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive email notifications for scheduled posts
              </p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications
                  ? "bg-indigo-600"
                  : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  emailNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Default Timezone
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set your default timezone for scheduling
              </p>
            </div>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-64 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="(UTC+05:00) Pakistan Standard Time">
                (UTC+05:00) Pakistan Standard Time
              </option>
              <option value="(UTC-05:00) Eastern Time (US & Canada)">
                (UTC-05:00) Eastern Time (US & Canada)
              </option>
              <option value="(UTC) Greenwich Mean Time">
                (UTC) Greenwich Mean Time
              </option>
              <option value="(UTC+01:00) Central European Time">
                (UTC+01:00) Central European Time
              </option>
            </select>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition disabled:bg-indigo-400"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}