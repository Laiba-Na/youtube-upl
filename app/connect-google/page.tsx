"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { AiOutlineArrowRight } from "react-icons/ai";

export default function ConnectGoogle() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [googleAccounts, setGoogleAccounts] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch the list of connected Google accounts from the backend
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
      // If we have a completed Google connection, save it
      if (session?.googleConnection) {
        saveGoogleConnection();
      }
    }
  }, [status, session, router, fetchGoogleAccounts]);

  // Save Google connection data to our database
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

  // Handler for connecting a new Google account
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

  // Handler to delete a connected Google account
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
    <div className="relative min-h-screen flex flex-col md:flex-row bg-white">
      {/* LEFT SECTION: Connect Google */}
      <div className="md:w-1/2 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primaryRed to-primaryPurple text-white">
        <div className="max-w-md w-full">
          <h2 className="text-3xl font-bold mb-6 text-center">
            Connect Your Google Accounts
          </h2>

          {error && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-2 text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded border border-green-400 bg-green-100 px-4 py-2 text-green-700">
              {successMessage}
            </div>
          )}

          <div className="mb-6 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-primaryPurple">
            <strong>Current User:</strong> {session?.user?.email || "Not signed in"}
          </div>

          <button
            onClick={handleConnectGoogle}
            disabled={isConnecting}
            className="w-full rounded bg-highlightOrange hover:scale-105 transition-all py-2 px-4 font-semibold text-white shadow hover:opacity-90 disabled:cursor-not-allowed"
          >
            {isConnecting ? "Connecting..." : "Connect with Google"}
          </button>
        </div>
      </div>

      {/* CENTER ARROW BUTTON - Positioned toward the bottom */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10">
        <Link
          className="group flex items-center justify-center w-12 h-12 rounded-full overflow-hidden bg-highlightOrange shadow-md transition-all duration-300 hover:w-48"
          href="/Dashboard"
        >
          <AiOutlineArrowRight className="text-xl transition-transform duration-300 group-hover:-rotate-90 fill-white" />
          <span className="ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 text-sm whitespace-nowrap text-white">
            Start uploading content
          </span>
        </Link>
      </div>

      {/* RIGHT SECTION: Connected Accounts */}
      <div className="md:w-1/2 flex flex-col items-center justify-center p-8 bg-white text-textBlack">
        <div className="max-w-md w-full">
          <h3 className="text-2xl font-bold mb-4">Connected Accounts</h3>

          {isLoading ? (
            <p className="text-gray-500">Loading accounts...</p>
          ) : googleAccounts.length === 0 ? (
            <p>No Google accounts connected yet.</p>
          ) : (
            <ul className="divide-y border rounded">
              {googleAccounts.map((account) => (
                <li key={account.id} className="flex items-center justify-between p-3">
                  <span>{account.googleEmail}</span>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="rounded bg-gray-300 px-2 py-1 font-bold text-gray-800 hover:bg-gray-400"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-blue-600 hover:text-blue-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
