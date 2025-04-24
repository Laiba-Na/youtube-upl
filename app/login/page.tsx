"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/social-links");
    }

    const registered = searchParams.get("registered");
    if (registered === "true") {
      setIsRegistered(true);
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
        throw new Error(result.error);
      }

      router.push("/social-links");
    } catch (error: any) {
      setError(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-500 via-primaryPurple to-primaryRed p-4">
      {/* 
        If you'd like to replicate the fluid/abstract shapes in the background, 
        you can place absolutely positioned divs or svgs here. For simplicity,
        this example only uses a gradient background.
      */}

      <div className="relative w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        {/* Header */}
        <h2 className="mb-6 text-center text-2xl font-bold text-textBlack">
          User Login
        </h2>

        {/* Registration success message */}
        {isRegistered && (
          <div className="mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
            Account created successfully! Please sign in.
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full rounded border border-gray-300 px-3 py-2 text-textBlack placeholder-gray-400 focus:border-primaryPurple focus:outline-none focus:ring-1 focus:ring-primaryPurple"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="block w-full rounded border border-gray-300 px-3 py-2 text-textBlack placeholder-gray-400 focus:border-primaryPurple focus:outline-none focus:ring-1 focus:ring-primaryPurple"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* "Forgot Username password?" link */}
          <div className="text-right text-sm">
            <Link href="#" className="text-purple-600 hover:text-primaryPurple">
              Forgot Username / Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded   bg-primaryPurple px-4 py-2 text-sm font-medium text-white shadow-md hover:border-2 hover:bg-white hover:border-primaryPurple focus:outline-none focus:ring-2 focus:ring-primaryPurple focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:text-primaryPurple"
          >
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Create Account Link */}
        <div className="mt-4 text-center text-sm">
          <Link href="/register" className="font-medium text-purple-600 hover:text-primaryPurple">
            Create Your Account &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
