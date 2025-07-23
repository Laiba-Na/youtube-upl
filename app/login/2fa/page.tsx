"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function TwoFactorAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      // Make sure we're explicitly setting the 2FA credentials
      const signInResponse = await signIn("credentials", {
        redirect: false,
        userId: userId,
        twoFactorToken: token,
        // Important: add a flag to distinguish this from regular login
        is2FAVerification: "true"
      });

      if (signInResponse?.error) {
        console.error("2FA verification error:", signInResponse.error);
        setError(signInResponse.error);
        setIsLoading(false);
        return;
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      console.error("2FA error:", error);
      setError(error.message || "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-sm">
        <h2 className="text-3xl font-bold text-textBlack mb-4 text-center">
          Two-Factor Authentication
        </h2>
        <p className="text-gray-500 text-center mb-6">
          Enter the 6-digit code from your authenticator app
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-primaryRed px-4 py-3 mb-4 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-textBlack mb-1"
            >
              2FA Code
            </label>
            <input
              id="token"
              name="token"
              type="text"
              required
              className="block w-full rounded-md bg-textBlack p-3 focus:bg-white focus:text-textBlack"
              placeholder="Enter 6-digit code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primaryPurple hover:bg-white hover:border-primaryPurple hover:border-2 hover:text-primaryPurple focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}