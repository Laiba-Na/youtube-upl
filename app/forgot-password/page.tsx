"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDarkMode } from "@/app/DarkModeContext";

export default function ForgotPassword() {
  const router = useRouter();
  const { darkMode } = useDarkMode();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      // Call the API to process password reset
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      // Send email with EmailJS
      const emailJsResponse = await fetch("/api/auth/send-reset-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.newPassword,
        }),
      });

      if (!emailJsResponse.ok) {
        const emailJsData = await emailJsResponse.json();
        throw new Error(emailJsData.error || "Failed to send email");
      }

      setMessage("Password reset successful! Check your email for your new password.");
    } catch (error: any) {
      setError(error.message || "Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-10 transition-all duration-300">
        <div className="flex justify-center items-center space-x-3 mb-6">
          <span className="w-4 h-4 rounded-full bg-primaryPurple animate-pulse"></span>
          <span className="w-4 h-4 rounded-full bg-highlightBlue animate-pulse delay-100"></span>
          <span className="w-4 h-4 rounded-full bg-primaryRed animate-pulse delay-200"></span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-textBlack dark:text-white mb-3 text-center">
          Forgot Password
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
          Enter your email address and we'll send you a new password
        </p>

        {message && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-500 text-green-700 dark:text-green-400 px-4 py-3 mb-6 rounded-lg">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-primaryRed text-primaryRed dark:text-red-400 px-4 py-3 mb-6 rounded-lg animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email-address"
              className="block text-sm font-medium text-textBlack dark:text-gray-200 mb-2"
            >
              Email Address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-textBlack dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-highlightBlue focus:border-highlightBlue transition-all duration-200"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                Processing...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        <div className="text-sm text-center mt-6 text-gray-500 dark:text-gray-400">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-primaryPurple hover:text-highlightBlue dark:hover:text-highlightBlue transition-colors duration-200"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}