'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDarkMode } from '@/app/DarkModeContext';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Settings {
  name?: string;
  email?: string;
  emailNotifications?: boolean;
  timezone?: string;
  profileImage?: string;
  darkMode?: boolean;
}

export default function ProfileSettings() {
  const { data: session } = useSession();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [timezone, setTimezone] = useState('(UTC+05:00) Pakistan Standard Time');
  const [profileImage, setProfileImage] = useState('/default-profile.png');
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
      const data: Settings = await response.json();
      setName(data.name || '');
      setEmail(data.email || '');
      setEmailNotifications(data.emailNotifications ?? true);
      setTimezone(data.timezone || '(UTC+05:00) Pakistan Standard Time');
      setProfileImage(data.profileImage || '/default-profile.png');
      // Remove darkMode toggle logic
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      toast.error(errorMessage);
    } finally {
      setIsFetching(false);
    }
  };
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('File must be a JPEG, PNG, or GIF');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
      const { url } = await response.json();
      setProfileImage(url);
      toast.success('Profile image updated!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload profile image';
      toast.error(errorMessage);
    }
  };

  const saveSettings = async () => {
    if (!session?.user?.id) {
      toast.error('Please log in to save settings');
      return;
    }

    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Invalid email format');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          emailNotifications,
          timezone,
          profileImage,
          darkMode,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save settings: ${response.statusText}`);
      }

      toast.success('Settings saved successfully!');
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
        Profile Settings
      </h2>

      {isFetching ? (
        <div className="flex justify-center">
          <LoadingSpinner size="lg" className="text-primaryPurple" />
        </div>
      ) : (
        <>
          {/* Profile Section */}
          <section className="mb-8">
            <h3 className="text-xl font-medium mb-4 text-textBlack dark:text-white">
              Profile
            </h3>
            <div className="flex items-center space-x-6">
              <div>
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{email}</p>
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
                  onClick={() => document.getElementById('profile-upload')?.click()}
                  className="px-4 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200"
                  aria-label="Change profile image"
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
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1 text-textBlack dark:text-white"
                >
                  Name <span className="text-primaryRed">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-textBlack dark:text-white focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1 text-textBlack dark:text-white"
                >
                  Email <span className="text-primaryRed">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-textBlack dark:text-white focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue"
                  required
                  aria-required="true"
                />
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="mb-8">
            <h3 className="text-xl font-medium mb-4 text-textBlack dark:text-white">
              Preferences
            </h3>
            <div className="space-y-4">
              
              <div className="flex items-center justify-between py-3 border-b border-gray-300 dark:border-gray-600">
                <div>
                  <p className="font-medium text-textBlack dark:text-white">
                    Email Notifications
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive email notifications for scheduled posts
                  </p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailNotifications ? 'bg-primaryPurple' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                  aria-label={emailNotifications ? 'Disable email notifications' : 'Enable email notifications'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-textBlack dark:text-white">Default Timezone</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Set your default timezone for scheduling
                  </p>
                </div>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-64 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-textBlack dark:text-white focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue"
                  aria-label="Select timezone"
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
              className="px-4 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200 disabled:bg-gray-400"
              aria-label="Save profile settings"
            >
              {loading ? (
                <span className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2 text-white" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}