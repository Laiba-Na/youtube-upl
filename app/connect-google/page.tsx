// connect-google/page.tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

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
    console.log("Fetching Google accounts...");
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/google/accounts", {
        credentials: "include",
        cache: "no-store"
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to fetch connected Google accounts");
      }

      const data = await res.json();
      console.log("Fetched Google accounts:", data.accounts);
      setGoogleAccounts(data.accounts || []);
    } catch (err: any) {
      console.error("Error fetching accounts:", err);
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
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to connect Google account");
      }
      
      const data = await res.json();
      setSuccessMessage("Google account connected successfully!");
      
      // Refresh everything
      await updateSession();
      await fetchGoogleAccounts();
    } catch (err: any) {
      setError(err.message || "Failed to connect Google account");
    } finally {
      setIsConnecting(false);
    }
  };

  
  // In handleConnectGoogle() in connect-google/page.tsx
const handleConnectGoogle = async () => {
  setIsConnecting(true);
  setError("");
  try {
    // Add a state parameter to indicate we're connecting a new account
    await signIn("google", {
      callbackUrl: "/connect-google",
      redirect: true,
    });
  } catch (err) {
    console.error("Google sign-in error:", err);
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
      
      // Refresh everything
      await updateSession();
      await fetchGoogleAccounts();
    } catch (err: any) {
      setError(err.message || "Failed to delete account");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow p-6">
        <h2 className="text-center text-2xl font-bold mb-4">
          Connect Your Google Accounts
        </h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4">
            {successMessage}
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
          <p><strong>Current User:</strong> {session?.user?.email || "Not signed in"}</p>
        </div>
        
        <div className="mb-4">
          <button
            onClick={handleConnectGoogle}
            disabled={isConnecting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            {isConnecting ? "Connecting..." : "Connect with Google"}
          </button>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Connected Accounts:</h3>
          
          {isLoading ? (
            <p className="text-gray-500">Loading accounts...</p>
          ) : googleAccounts.length === 0 ? (
            <p>No Google accounts connected yet.</p>
          ) : (
            <ul className="border rounded divide-y">
              {googleAccounts.map((account) => (
                <li
                  key={account.id}
                  className="flex justify-between items-center p-3"
                >
                  <span>{account.googleEmail}</span>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-2 rounded"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-blue-600 hover:text-blue-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}