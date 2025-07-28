'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Toaster } from 'react-hot-toast';

export default function TwoFactorSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const is2faEnabled = searchParams.get('2fa') === 'enabled';

  useEffect(() => {
    if (is2faEnabled) {
      const timer = setTimeout(async () => {
        await signOut({ redirect: false });
        router.push('/login?2fa=enabled');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [is2faEnabled, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl text-center">
        {is2faEnabled ? (
          <>
            <h2 className="text-3xl font-bold text-textBlack mb-4">
              Two-Factor Authentication Enabled
            </h2>
            <p className="text-gray-500 mb-6 text-sm">
              Your account is now protected with two-factor authentication. You will be signed out in a few seconds and can log in using your authenticator app.
            </p>
            <div className="flex justify-center">
              <LoadingSpinner size="lg" className="text-primaryPurple animate-pulse" />
            </div>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-textBlack mb-4">
              2FA Success
            </h2>
            <p className="text-gray-500 mb-6 text-sm">
              No action required. Navigate to the 2FA setup page to enable two-factor authentication.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => router.push('/settings/2fa')}
                className="px-6 py-2 bg-primaryPurple text-white rounded-lg hover:bg-highlightBlue hover:shadow-md transition-all duration-200"
                aria-label="Set up 2FA"
              >
                Set Up 2FA
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}