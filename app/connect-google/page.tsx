"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { AiOutlineArrowRight } from "react-icons/ai";
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/sideBar';
import { Menu } from 'lucide-react';
import { useDarkMode } from '@/app/DarkModeContext';

export default function ConnectGoogle() {
  const { data: session, status, update: updateSession } = useSession();
  const { darkMode } = useDarkMode();
  const router = useRouter();
  const [googleAccounts, setGoogleAccounts] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchGoogleAccounts = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/google/accounts", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to fetch connected Google accounts");
      }

      const data = await res.json();
      setGoogleAccounts(data.accounts || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch accounts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated") {
      fetchGoogleAccounts();
      if (session?.googleConnection) {
        saveGoogleConnection();
      }
    }
  }, [status, session, router, fetchGoogleAccounts]);

  const saveGoogleConnection = async () => {
    try {
      setIsConnecting(true);
      const res = await fetch("/api/google/connect", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to connect Google account");
      }

      setSuccessMessage("Google account connected successfully!");
      await updateSession();
      await fetchGoogleAccounts();
    } catch (err: any) {
      setError(err.message || "Failed to connect Google account");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setError("");
    try {
      await signIn("google", {
        callbackUrl: "/connect-google",
        redirect: true,
      });
    } catch (err) {
      setError("Failed to connect with Google. Please try again.");
      setIsConnecting(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      setError("");
      setSuccessMessage("");
      const res = await fetch(`/api/google/accounts/${accountId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete the account");
      }

      setSuccessMessage("Google account disconnected successfully!");
      await updateSession();
      await fetchGoogleAccounts();
    } catch (err: any) {
      setError(err.message || "Failed to delete account");
    }
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
            <h1 className="text-3xl font-bold text-textBlack dark:text-white mb-6">Connect Google Accounts</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Section: Connect Google */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-semibold text-textBlack dark:text-white mb-4">
                  Connect a New Google Account
                </h2>
                {error && (
                  <div className="mb-4 bg-red-100 dark:bg-red-900/30 border border-primaryRed text-primaryRed dark:text-red-400 px-4 py-3 rounded-lg animate-shake">
                    {error}
                  </div>
                )}
                {successMessage && (
                  <div className="mb-4 bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
                    {successMessage}
                  </div>
                )}
                <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-primaryPurple dark:text-blue-300 px-4 py-3 rounded-lg">
                  <strong>Current User:</strong> {session?.user?.email || "Not signed in"}
                </div>
                <button
                  onClick={handleConnectGoogle}
                  disabled={isConnecting}
                  className={`w-full px-6 py-3 rounded-lg text-white font-semibold transition-all duration-200 ${
                    isConnecting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primaryPurple hover:bg-highlightBlue hover:shadow-md'
                  }`}
                  aria-label="Connect with Google"
                >
                  {isConnecting ? "Connecting..." : "Connect with Google"}
                </button>
              </div>
              {/* Right Section: Connected Accounts */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-semibold text-textBlack dark:text-white mb-4">
                  Connected Accounts
                </h2>
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <svg className="animate-spin h-8 w-8 text-primaryPurple" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                    </svg>
                  </div>
                ) : googleAccounts.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">No Google accounts connected yet.</p>
                ) : (
                  <ul className="divide-y border border-gray-300 dark:border-gray-600 rounded-lg">
                    {googleAccounts.map((account) => (
                      <li key={account.id} className="flex items-center justify-between p-3 text-textBlack dark:text-white">
                        <span className="truncate">{account.googleEmail}</span>
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="px-3 py-1 bg-primaryRed text-white rounded-lg hover:bg-red-600 hover:shadow-md transition-all duration-200"
                          aria-label={`Delete account ${account.googleEmail}`}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {/* Center Arrow Button */}
            <div className="mt-6 flex justify-center">
              <Link
                className="group flex items-center justify-center w-12 h-12 rounded-full bg-primaryPurple shadow-md transition-all duration-300 hover:w-48 hover:bg-highlightBlue"
                href="/DASHBOARD"
                aria-label="Start uploading content"
              >
                <AiOutlineArrowRight className="text-xl text-white transition-transform duration-300 group-hover:-rotate-90" />
                <span className="ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 text-sm text-white whitespace-nowrap">
                  Start uploading content
                </span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}