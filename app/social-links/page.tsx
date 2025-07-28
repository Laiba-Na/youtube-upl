"use client";

import { JSX, useState } from "react";
import { useRouter } from "next/navigation";
import { FaYoutube, FaFacebook, FaTumblr, FaPinterest, FaTwitter } from "react-icons/fa";
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/sideBar';
import { Menu } from 'lucide-react';
import { useDarkMode } from '@/app/DarkModeContext';

interface SocialMedia {
  name: string;
  url: string;
  icon: JSX.Element;
}

export default function SocialLinks() {
  const { darkMode } = useDarkMode();
  const router = useRouter();
  const [selectedSocials, setSelectedSocials] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const socialMedia: SocialMedia[] = [
    {
      name: "YouTube",
      url: "https://accounts.google.com/signin",
      icon: <FaYoutube className="text-red-600 text-4xl" />,
    },
    {
      name: "Facebook",
      url: "https://www.facebook.com/login",
      icon: <FaFacebook className="text-blue-600 text-4xl" />,
    },
    {
      name: "Tumblr",
      url: "https://www.tumblr.com/login",
      icon: <FaTumblr className="text-blue-800 text-4xl" />,
    },
    {
      name: "Pinterest",
      url: "https://www.pinterest.com/login",
      icon: <FaPinterest className="text-red-700 text-4xl" />,
    },
    {
      name: "X (Twitter)",
      url: "https://twitter.com/login",
      icon: <FaTwitter className="text-blue-400 text-4xl" />,
    },
  ];

  const handleCheckboxChange = (socialName: string) => {
    setSelectedSocials((prev) =>
      prev.includes(socialName)
        ? prev.filter((name) => name !== socialName)
        : [...prev, socialName]
    );
  };

  const handleOpenTabs = () => {
    selectedSocials.forEach((socialName) => {
      const social = socialMedia.find((s) => s.name === socialName);
      if (social) {
        if (social.name === "YouTube") {
          window.open("/connect-google", "_blank", "noopener,noreferrer");
        } else {
          window.open(social.url, "_blank", "noopener,noreferrer");
        }
      }
    });
    router.push("/Dashboard");
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <TopBar />
      <div className="flex">
        <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <button
          className={`lg:hidden fixed top-4 right-4 z-50 p-2 text-white bg-primaryPurple rounded-full hover:bg-highlightBlue transition-all duration-200 ${isSidebarOpen ? 'hidden' : 'block'}`}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <main className="flex-1 p-6 lg:pl-8 lg:pt-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-textBlack dark:text-white mb-6">
              Select Social Media Platforms
            </h1>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {socialMedia.map((social) => (
                  <div key={social.name} className="flex flex-col items-center">
                    <label className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-xl hover:bg-gradient-to-br hover:from-primaryRed/20 hover:to-primaryPurple/20 transition-all duration-200 w-full cursor-pointer">
                      <div className="flex items-center space-x-4">
                        {social.icon}
                        <span className="text-lg font-semibold text-textBlack dark:text-white">{social.name}</span>
                        <input
                          type="checkbox"
                          checked={selectedSocials.includes(social.name)}
                          onChange={() => handleCheckboxChange(social.name)}
                          className="h-5 w-5 text-highlightBlue focus:ring-highlightBlue rounded"
                          aria-label={`Select ${social.name}`}
                        />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleOpenTabs}
                  disabled={selectedSocials.length === 0}
                  className={`w-full sm:w-auto px-6 py-3 rounded-lg text-white font-semibold transition-all duration-200 ${
                    selectedSocials.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primaryPurple hover:bg-highlightBlue hover:shadow-md'
                  }`}
                  aria-label="Connect to selected platforms"
                >
                  Connect to Selected Platforms
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}