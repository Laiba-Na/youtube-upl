"use client";

import Link from "next/link";
import { FaYoutube, FaFacebook, FaTumblr, FaPinterest, FaTwitter } from "react-icons/fa";

export default function SocialLinks() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {/* First Column - YouTube */}
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4 text-textBlack">Upload videos on</h2>
          <Link
            href="/connect-google"
            className="flex flex-col items-center justify-center p-[6vw] bg-white hover:bg-gradient-to-br hover:from-primaryRed/30 hover:from-20% hover:to-primaryPurple/30 hover:to-100% rounded-lg shadow hover:shadow-xl transition w-full"
          >
            <FaYoutube className="text-red-600 text-6xl mb-4" />
            <span className="text-lg font-semibold text-textBlack">YouTube</span>
          </Link>
        </div>

        {/* Second Column - Facebook, Tumblr, Pinterest */}
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4 text-textBlack">Make a post to</h2>
          <div className="space-y-4 w-full">
            <Link
              href="/facebook"
              className="flex flex-col items-center justify-center p-4 bg-white hover:bg-gradient-to-br hover:from-primaryRed/30 hover:from-20% hover:to-primaryPurple/30 hover:to-100% rounded-lg shadow hover:shadow-xl transition w-full"
            >
              <FaFacebook className="text-blue-600 text-4xl mb-2" />
              <span className="text-lg font-semibold text-textBlack">Facebook</span>
            </Link>

            <Link
              href="/tumblr"
              className="flex flex-col items-center justify-center p-4 bg-white hover:bg-gradient-to-br hover:from-primaryRed/30 hover:from-20% hover:to-primaryPurple/30 hover:to-100% rounded-lg shadow hover:shadow-xl transition w-full"
            >
              <FaTumblr className="text-blue-800 text-4xl mb-2" />
              <span className="text-lg font-semibold text-textBlack">Tumblr</span>
            </Link>

            <Link
              href="/pinterest"
              className="flex flex-col items-center justify-center p-4 bg-white hover:bg-gradient-to-br hover:from-primaryRed/30 hover:from-20% hover:to-primaryPurple/30 hover:to-100% rounded-lg shadow hover:shadow-xl transition w-full"
            >
              <FaPinterest className="text-red-700 text-4xl mb-2" />
              <span className="text-lg font-semibold text-textBlack">Pinterest</span>
            </Link>
          </div>
        </div>

        {/* Third Column - X (Twitter) */}
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4 text-textBlack">Share your thoughts on</h2>
          <Link
            href="/twitter"
            className="flex flex-col items-center justify-center p-[6vw] bg-white hover:bg-gradient-to-br hover:from-primaryRed/30 hover:from-20% hover:to-primaryPurple/30 hover:to-100% rounded-lg shadow hover:shadow-xl transition w-full"
          >
            <FaTwitter className="text-blue-400 text-6xl mb-4" />
            <span className="text-lg font-semibold text-textBlack">X (Twitter)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}