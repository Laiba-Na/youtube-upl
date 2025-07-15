"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TwoFactorSetup() {
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch QR code and secret on mount
    const fetchQrCode = async () => {
      try {
        const response = await fetch("/api/auth/2fa/setup");
        if (!response.ok) {
          throw new Error("Failed to generate QR code");
        }
        const data = await response.json();
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
      } catch (error: any) {
        setError(error.message || "Something went wrong");
      }
    };
    fetchQrCode();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid 2FA code");
      }

      router.push("/settings/2fa-success?2fa=enabled");
    } catch (error: any) {
      setError(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-sm">
        <h2 className="text-3xl font-bold text-textBlack mb-4 text-center">
          Enable Two-Factor Authentication
        </h2>
        <p className="text-gray-500 text-center mb-6">
          Scan the QR code with your authenticator app and enter the code below
        </p>

        {qrCodeUrl && (
          <div className="flex justify-center mb-4">
            <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
          </div>
        )}

        <p className="text-gray-500 text-center mb-4">
          Or manually enter this key: <strong>{secret}</strong>
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
            {isLoading ? "Enabling 2FA..." : "Enable 2FA"}
          </button>
        </form>
      </div>
    </div>
  );
}