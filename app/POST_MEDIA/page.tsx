'use client';

import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  const handleRedirect = () => {
    router.push('/POST_CATALOG');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primaryPurple to-primaryRed">
      <div className="text-center">
        <div className="flex justify-center items-center space-x-2 mb-6">
          <span className="w-3 h-3 rounded-full bg-primaryPurple"></span>
          <span className="w-3 h-3 rounded-full bg-textBlack"></span>
          <span className="w-3 h-3 rounded-full bg-primaryRed"></span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-6">Welcome</h1>
        <button
          onClick={handleRedirect}
          className="px-6 py-2 border border-white rounded-full text-white hover:bg-white hover:text-primaryPurple transition-colors"
        >
          View Your Posts
        </button>
      </div>
    </div>
  );
}