"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Toaster } from "react-hot-toast";

export default function TwoFactorSetup() {
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        const response = await fetch("/api/auth/2fa/setup", {
          credentials: "include",
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate QR code");
        }
        const data = await response.json();
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong";
        setError(errorMessage);
        toast.error(errorMessage);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid 2FA code");
      }

      toast.success("Two-factor authentication enabled!");
      router.push("/SETTINGS/2fa-success?2fa=enabled");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-textBlack mb-4 text-center">
          Enable Two-Factor Authentication
        </h2>
        <p className="text-gray-500 text-center mb-6 text-sm">
          Scan the QR code with your authenticator app and enter the code below
        </p>

        {qrCodeUrl ? (
          <div className="flex justify-center mb-6">
            <img
              src={qrCodeUrl}
              alt="2FA QR Code"
              className="w-48 h-48 rounded-lg border border-gray-300"
            />
          </div>
        ) : (
          <div className="flex justify-center mb-6">
            <LoadingSpinner size="lg" className="text-primaryPurple" />
          </div>
        )}

        {secret && (
          <p className="text-gray-500 text-center mb-6 text-sm">
            Or manually enter this key:{" "}
            <strong className="text-textBlack">{secret}</strong>
          </p>
        )}

        {error && (
          <div className="mb-6 border border-primaryRed bg-primaryRed/10 text-primaryRed px-4 py-3 rounded-2xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-textBlack mb-1"
            >
              2FA Code <span className="text-primaryRed">*</span>
            </label>
            <input
              id="token"
              name="token"
              type="text"
              required
              aria-required="true"
              className="block w-full rounded-lg p-3 border border-gray-300 focus:outline-none focus:ring-highlightBlue focus:border-highlightBlue text-textBlack"
              placeholder="Enter 6-digit code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-highlightBlue disabled:bg-primaryPurple/50 transition-all duration-200"
            aria-label={isLoading ? "Enabling 2FA" : "Enable 2FA"}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner size="sm" className="mr-2 text-white" />
                Enabling 2FA...
              </span>
            ) : (
              "Enable 2FA"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
