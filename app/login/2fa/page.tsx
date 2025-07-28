"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useDarkMode } from "@/app/DarkModeContext";

export default function TwoFactorAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { darkMode } = useDarkMode();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const userId = searchParams.get("userId");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!userId) {
      setError("User ID is missing");
      setIsLoading(false);
      return;
    }

    try {
      const signInResponse = await signIn("credentials", {
        redirect: false,
        userId: userId,
        twoFactorToken: token,
        is2FAVerification: "true"
      });

      if (signInResponse?.error) {
        console.error("2FA verification error:", signInResponse.error);
        setError(signInResponse.error);
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (error: any) {
      console.error("2FA error:", error);
      setError(error.message || "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-10 transition-all duration-300">
        <div className="flex justify-center items-center space-x-3 mb-6">
          <span className="w-4 h-4 rounded-full bg-primaryPurple animate-pulse"></span>
          <span className="w-4 h-4 rounded-full bg-highlightBlue animate-pulse delay-100"></span>
          <span className="w-4 h-4 rounded-full bg-primaryRed animate-pulse delay-200"></span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-textBlack dark:text-white mb-3 text-center">
          Two-Factor Authentication
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
          Enter the 6-digit code from your authenticator app
        </p>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-primaryRed text-primaryRed dark:text-red-400 px-4 py-3 mb-6 rounded-lg animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-textBlack dark:text-gray-200 mb-2"
            >
              2FA Code
            </label>
            <input
              id="token"
              name="token"
              type="text"
              required
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-textBlack dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-highlightBlue focus:border-highlightBlue transition-all duration-200"
              placeholder="Enter 6-digit code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primaryPurple text-white rounded-lg font-semibold hover:bg-highlightBlue dark:hover:bg-highlightBlue transition-all duration-300 shadow-md hover:shadow-lg focus:ring-2 focus:ring-highlightBlue focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                </svg>
                Verifying...
              </span>
            ) : (
              "Verify"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}