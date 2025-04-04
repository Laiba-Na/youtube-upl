"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Registration failed");
      }

      router.push("/login?registered=true");
    } catch (error: any) {
      setError(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side (Welcome Back) */}
      <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-primaryPurple  to-primaryRed p-8 text-white">
        <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
        <p className="max-w-sm text-center">
          To keep connected with us please login with your personal info
        </p>
        <Link href="/login" className="mt-6">
          <button
            type="button"
            className="px-6 py-2 border border-white rounded-full hover:bg-white hover:text-primaryPurple transition-colors"
          >
            Sign In
          </button>
        </Link>
      </div>

      {/* Right side (Create Account) */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-white p-6 sm:p-12">
        {/* Small color dots (optional) */}
        <div className="flex justify-center items-center space-x-2 mb-4">
          <span className="w-3 h-3 rounded-full bg-primaryPurple"></span>
          <span className="w-3 h-3 rounded-full bg-textBlack"></span>
          <span className="w-3 h-3 rounded-full bg-primaryRed"></span>
        </div>

        <h2 className="text-3xl font-bold text-textBlack mb-2 text-center">
          Create Account
        </h2>
        <p className="text-gray-500 text-center mb-6">
          or use email for registration
        </p>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-primaryRed px-4 py-3 mb-4 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-textBlack mb-1 "
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="block w-full rounded-md bg-textBlack p-3 focus:bg-white focus:text-textBlack "
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="email-address"
              className="block text-sm font-medium text-textBlack mb-1"
            >
              Email Address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full rounded-md bg-textBlack p-3 focus:bg-white focus:text-textBlack "
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-textBlack mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="block w-full rounded-md bg-textBlack p-3 focus:bg-white focus:text-textBlack "
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primaryPurple hover:bg-white hover:border-primaryPurple hover:border-2 hover:text-primaryPurple focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        {/* Already have account */}
        <div className="text-sm text-center mt-4 text-primaryPurple">
        Already have an account? &nbsp;
          <Link
            href="/login"
            className="font-medium text-primaryPurple hover:text-primaryRed"
          >
             Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
