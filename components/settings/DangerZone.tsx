'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useDarkMode } from '@/app/DarkModeContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DangerZone() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) {
      toast.error('Please log in to delete your account');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      toast.success('Account deleted successfully');
      router.push('/register');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-textBlack dark:text-white">
        Danger Zone
      </h2>
      <div className="border border-primaryRed/50 dark:border-primaryRed/30 p-4 rounded-2xl">
        <h3 className="text-lg font-medium text-primaryRed dark:text-red-200">
          Delete Account
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={() => setIsOpen(true)}
          className="mt-4 bg-primaryRed text-white px-4 py-2 rounded-lg hover:bg-red-700 hover:shadow-md transition-all duration-200"
          aria-label="Delete account"
        >
          Delete Account
        </button>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium text-textBlack dark:text-white">
                    Confirm Account Deletion
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Are you sure you want to delete your account? This will remove all your data, including posts, projects, and connected accounts. This action cannot be undone.
                    </p>
                  </div>
                  <div className="mt-4 flex space-x-4">
                    <button
                      type="button"
                      className="flex-1 bg-gray-300 dark:bg-gray-600 text-textBlack dark:text-gray-200 rounded-lg px-4 py-2 hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200"
                      onClick={() => setIsOpen(false)}
                      aria-label="Cancel deletion"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="flex-1 bg-primaryRed text-white rounded-lg px-4 py-2 hover:bg-red-700 transition-all duration-200 disabled:bg-red-400"
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      aria-label="Confirm deletion"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <LoadingSpinner size="sm" className="mr-2 text-white" />
                          Deleting...
                        </span>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}