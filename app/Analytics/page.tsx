"use client";

import Link from "next/link";
import { FaYoutube, FaFacebook, FaTumblr, FaPinterest, FaTwitter } from "react-icons/fa";

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-textBlack">Analytics</h1>
      <div className="flex gap-8 w-full max-w-6xl justify-center">
        {/* YouTube */}
        <Link
          href="/youtube/Analytics"
          className="flex flex-col items-center justify-center p-8 bg-white hover:bg-gradient-to-br hover:from-primaryRed/30 hover:from-20% hover:to-primaryPurple/30 hover:to-100% rounded-lg shadow hover:shadow-xl transition w-full h-64"
        >
          <FaYoutube className="text-red-600 text-6xl mb-4" />
          <span className="text-lg font-semibold text-textBlack">YouTube</span>
        </Link>

        {/* Facebook */}
        <Link
          href="/facebook/analytics"
          className="flex flex-col items-center justify-center p-8 bg-white hover:bg-gradient-to-br hover:from-primaryRed/30 hover:from-20% hover:to-primaryPurple/30 hover:to-100% rounded-lg shadow hover:shadow-xl transition w-full h-64"
        >
          <FaFacebook className="text-blue-600 text-6xl mb-4" />
          <span className="text-lg font-semibold text-textBlack">Facebook</span>
        </Link>

       
      </div>
    </div>
  );
}