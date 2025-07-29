"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDarkMode } from "@/app/DarkModeContext";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { darkMode } = useDarkMode();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [is2faEnabled, setIs2faEnabled] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/DASHBOARD");
    }

    const registered = searchParams.get("registered");
    if (registered === "true") {
      setIsRegistered(true);
    }

    const is2faEnabled = searchParams.get("2fa") === "enabled";
    if (is2faEnabled) {
      setIs2faEnabled(true);
    }
  }, [status, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        if (
          result.error === "2FA_REQUIRED" ||
          result.error === "2FA required"
        ) {
          console.log("2FA required, redirecting to 2FA page");
          try {
            const response = await fetch(
              `/api/auth/getUserId?email=${encodeURIComponent(email)}`
            );
            const data = await response.json();

            if (data.userId) {
              router.push(`/login/2fa?userId=${data.userId}`);
              return;
            } else {
              setError("Failed to start 2FA verification");
            }
          } catch (apiError) {
            console.error("Error fetching user ID:", apiError);
            setError("Failed to start 2FA verification");
          }
        } else {
          setError(result.error);
        }
      } else {
        router.push("/DASHBOARD");
      }
    } catch (error: any) {
      setError(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Left side (Welcome Back) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-primaryPurple to-primaryRed p-8 text-white">
        <h2 className="text-4xl font-bold mb-6 animate-fade-in-up">Welcome Back</h2>
        <p className="max-w-md text-center text-lg opacity-90">
          Don’t have an account yet? Sign up to start managing your social media posts effortlessly.
        </p>
        <Link href="/register" className="mt-8">
          <button
            type="button"
            className="px-8 py-3 border-2 border-white rounded-full text-lg font-semibold hover:bg-white hover:text-primaryPurple transition-colors duration-300 shadow-md hover:shadow-lg"
          >
            Sign Up
          </button>
        </Link>
      </div>

      {/* Right side (Login Form) */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-10 transition-all duration-300">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <span className="w-4 h-4 rounded-full bg-primaryPurple animate-pulse"></span>
            <span className="w-4 h-4 rounded-full bg-highlightBlue animate-pulse delay-100"></span>
            <span className="w-4 h-4 rounded-full bg-primaryRed animate-pulse delay-200"></span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-textBlack dark:text-white mb-3 text-center">
            Sign In
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
            Log in to manage your Youtube-upl account
          </p>

          {isRegistered && (
            <div className="bg-green-100 dark:bg-green-900/30 border border-highlightYellow text-highlightYellow dark:text-yellow-400 px-4 py-3 mb-6 rounded-lg animate-fade-in">
              Account created successfully! Please sign in.
            </div>
          )}

          {is2faEnabled && (
            <div className="bg-green-100 dark:bg-green-900/30 border border-highlightYellow text-highlightYellow dark:text-yellow-400 px-4 py-3 mb-6 rounded-lg animate-fade-in">
              Two-factor authentication enabled. Please log in with your credentials and authenticator code.
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

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-textBlack dark:text-gray-200 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-textBlack dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-highlightBlue focus:border-highlightBlue transition-all duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

<div className="text-right text-sm">
  <Link
    href="/forgot-password"
    className="font-medium text-primaryPurple hover:text-highlightBlue dark:hover:text-highlightBlue transition-colors duration-200"
  >
    Forgot Username / Password?
  </Link>
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
                  Signing in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="text-sm text-center mt-6 text-gray-500 dark:text-gray-400">
            Don’t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primaryPurple hover:text-highlightBlue dark:hover:text-highlightBlue transition-colors duration-200"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}