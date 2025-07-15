"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";

export default function TwoFactorSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const is2faEnabled = searchParams.get("2fa") === "enabled";

  useEffect(() => {
    if (is2faEnabled) {
      // Sign out after a 3-second delay
      const timer = setTimeout(async () => {
        await signOut({ redirect: false });
        router.push("/login?2fa=enabled");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [is2faEnabled, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-sm">
        {is2faEnabled ? (
          <>
            <h2 className="text-3xl font-bold text-textBlack mb-4 text-center">
              Two-Factor Authentication Enabled
            </h2>
            <p className="text-gray-500 text-center mb-6">
              Your account is now protected with two-factor authentication. You will be signed out in a few seconds and can log in using your authenticator app.
            </p>
            <div className="flex justify-center">
              <svg
                className="w-16 h-16 text-primaryPurple animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-textBlack mb-4 text-center">
              2FA Success
            </h2>
            <p className="text-gray-500 text-center mb-6">
              No action required. Navigate to the 2FA setup page to enable two-factor authentication.
            </p>
            <div className="flex justify-center">
              <a
                href="/settings/2fa"
                className="px-6 py-2 border border-primaryPurple rounded-md text-primaryPurple hover:bg-primaryPurple hover:text-white transition-colors"
              >
                Set Up 2FA
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}