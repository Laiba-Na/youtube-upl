"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Account {
  id: string;
  provider: string;
  name: string;
}

export default function ConnectedAccounts() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadAccountsFromSession();
    }
  }, [session]);

  const loadAccountsFromSession = () => {
    setLoading(true);
    try {
      const formattedAccounts: Account[] = [
        ...(session?.user?.googleAccounts?.map((acc: any) => ({
          id: acc.id,
          provider: "Google",
          name: acc.googleEmail,
        })) || []),
        ...(session?.user?.facebookAccounts?.map((acc: any) => ({
          id: acc.id,
          provider: "Facebook",
          name: acc.pageName || "Facebook Account",
        })) || []),
      ];
      setAccounts(formattedAccounts);
    } catch (error) {
      toast.error("Failed to load connected accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (provider: string) => {
    signIn(provider.toLowerCase(), { callbackUrl: "/settings" });
  };

  const handleDisconnect = async (accountId: string, provider: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/${provider.toLowerCase()}/accounts`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect account");
      }

      toast.success(`${provider} account disconnected`);
      loadAccountsFromSession();
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect account");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = () => {
    router.push("/SETTINGS/2fa");
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        Connected Accounts
      </h2>

      {/* Connected Accounts Section */}
      <section className="mb-8">
        <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">
          Social Accounts
        </h3>
        {loading || status === "loading" ? (
          <p className="text-gray-500 dark:text-gray-400">
            Loading accounts...
          </p>
        ) : (
          <div className="space-y-4">
            {["Google", "Facebook"].map((provider) => {
              const connectedAccounts = accounts.filter(
                (acc) => acc.provider === provider
              );
              return (
                <div
                  key={provider}
                  className="border-b border-gray-300 dark:border-gray-700 pb-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {provider}
                      </p>
                      {connectedAccounts.length > 0 ? (
                        connectedAccounts.map((acc) => (
                          <div
                            key={acc.id}
                            className="flex items-center justify-between mt-2"
                          >
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {acc.name}
                            </p>
                            <button
                              onClick={() => handleDisconnect(acc.id, provider)}
                              disabled={loading}
                              className="text-red-600 border border-red-600 px-4 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                            >
                              Disconnect
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Not Connected
                        </p>
                      )}
                    </div>
                    {connectedAccounts.length === 0 && (
                      <button
                        onClick={() => handleConnect(provider)}
                        className="text-green-600 border border-green-600 px-4 py-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Security Section */}
      <section className="mb-8">
        <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">
          Security
        </h3>
        <div className="flex items-center justify-between py-3 border-b border-gray-300 dark:border-gray-700">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Two-Factor Authentication
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add an extra layer of security to your account
            </p>
          </div>
          <button
            onClick={handleEnable2FA}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition"
          >
            {session?.user?.twoFactorEnabled
              ? "Manage Two-Factor Authentication"
              : "Enable Two-Factor Authentication"}
          </button>
        </div>
      </section>
    </div>
  );
}