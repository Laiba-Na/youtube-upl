"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useDarkMode } from "@/app/DarkModeContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface GoogleAccount {
  id: string;
  googleEmail: string;
}

interface Account {
  id: string;
  provider: string;
  name: string;
}

export default function ConnectedAccounts() {
  const { data: session, status } = useSession();
  const { darkMode } = useDarkMode();
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
        ...(session?.user?.googleAccounts?.map((acc: GoogleAccount) => ({
          id: acc.id,
          provider: "Google",
          name: acc.googleEmail,
        })) || []),
      ];
      setAccounts(formattedAccounts);
    } catch (err) {
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
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to disconnect account");
      }

      toast.success(`${provider} account disconnected`);
      loadAccountsFromSession();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to disconnect account";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = () => {
    router.push("/SETTINGS/2fa");
  };

  const handleConnectOtherSocials = () => {
    router.push("/social-links");
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-textBlack dark:text-white">
        Connected Accounts
      </h2>

      {/* Connected Accounts Section */}
      <section className="mb-8">
        <h3 className="text-xl font-medium mb-4 text-textBlack dark:text-white">
          Social Accounts
        </h3>
        {loading || status === "loading" ? (
          <div className="flex items-center">
            <LoadingSpinner size="sm" className="text-primaryPurple mr-2" />
            <p className="text-gray-500 dark:text-gray-400">
              Loading accounts...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {["Google"].map((provider) => {
              const connectedAccounts = accounts.filter(
                (acc) => acc.provider === provider
              );
              return (
                <div
                  key={provider}
                  className="border-b border-gray-300 dark:border-gray-600 pb-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-textBlack dark:text-white">
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
                              className="text-primaryRed border border-primaryRed px-4 py-1 rounded-lg hover:bg-primaryRed/10 dark:hover:bg-primaryRed/20 disabled:opacity-50 transition-all duration-200"
                              aria-label={`Disconnect ${acc.name} ${provider} account`}
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
                        className="text-green-600 border border-green-600 px-4 py-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
                        aria-label={`Connect ${provider} account`}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="pt-4">
              <button
                onClick={handleConnectOtherSocials}
                className="text-highlightBlue border border-highlightBlue px-4 py-2 rounded-lg hover:bg-highlightBlue/10 dark:hover:bg-highlightBlue/20 transition-all duration-200"
                aria-label="Connect other social media"
              >
                Connect Other Social Media
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Security Section */}
      <section>
        <h3 className="text-xl font-medium mb-4 text-textBlack dark:text-white">
          Security
        </h3>
        <div className="flex items-center justify-between py-3 border-b border-gray-300 dark:border-gray-600">
          <div>
            <p className="font-medium text-textBlack dark:text-white">
              Two-Factor Authentication
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add an extra layer of security to your account
            </p>
          </div>
          <button
            onClick={handleEnable2FA}
            className="px-4 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200"
            aria-label={
              session?.user?.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"
            }
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
