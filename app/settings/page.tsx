"use client";

import { useState } from "react";
import ProfileSettings from "@/components/settings/ProfileSettings";
import ConnectedAccounts from "@/components/settings/ConnectedAccounts";
import NotificationSettings from "@/components/settings/NotificationSettings";
import TeamSettings from "@/components/settings/TeamSettings";
import DangerZone from "@/components/settings/DangerZone";
import { Toaster } from "react-hot-toast";

const tabs = [
  { name: "Profile", icon: "👤" },
  { name: "Connected Accounts", icon: "🔗" },
  { name: "Notifications", icon: "🔔" },
  { name: "Team", icon: "👥" },
  { name: "Danger Zone", icon: "⚠️" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-right" />
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Settings
        </h2>
        <ul className="space-y-2">
          {tabs.map((tab) => (
            <li key={tab.name}>
              <button
                onClick={() => setActiveTab(tab.name)}
                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg text-left transition-colors ${
                  activeTab === tab.name
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8">
        {activeTab === "Profile" && <ProfileSettings />}
        {activeTab === "Connected Accounts" && <ConnectedAccounts />}
        {activeTab === "Notifications" && <NotificationSettings />}
        {activeTab === "Team" && <TeamSettings />}
        {activeTab === "Danger Zone" && <DangerZone />}
      </main>
    </div>
  );
}