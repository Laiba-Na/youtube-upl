"use client";

import { useRouter } from "next/navigation";
import { useDarkMode } from "@/app/DarkModeContext";

export default function TeamSettings() {
  const { darkMode } = useDarkMode();
  const router = useRouter();

  const handleTeamSetup = () => {
    router.push("/SETTINGS/TEAM_SETUP");
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-textBlack dark:text-white">
        Team Settings
      </h2>
      <div className="mt-6">
        <button
          onClick={handleTeamSetup}
          className="w-full px-4 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200"
          aria-label="Go to team setup"
        >
          Team Setup
        </button>
      </div>
    </div>
  );
}
