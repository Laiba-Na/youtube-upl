"use client";

import { useRouter } from "next/navigation";

export default function TeamSettings() {
  const router = useRouter();

  const handleTeamSetup = () => {
    router.push("/SETTINGS/TEAM_SETUP");
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        Team Settings
      </h2>

      <div className="mt-6">
        <button
          onClick={handleTeamSetup}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Team Setup
        </button>
      </div>
    </div>
  );
}