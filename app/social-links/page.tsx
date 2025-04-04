"use client";

import Link from "next/link";
import { FaYoutube, FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";

export default function SocialLinks() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* YouTube Box */}
        <Link
          href="/connect-google"
          className="flex flex-col items-center justify-center p-[6vw] bg-white hover:bg-gradient-to-br hover:from-primaryRed/30 hover:from-20% hover:to-primaryPurple/30  hover:to-100% rounded-lg shadow hover:shadow-xl transition"
        >
          <FaYoutube className="text-red-600 text-6xl mb-4" />
          <span className="text-lg font-semibold text-textBlack">YouTube</span>
        </Link>

        {/* Facebook Box */}
        <Link
          href="/facebook"
          className="flex flex-col items-center justify-center p-[6vw] bg-white hover:bg-gradient-to-br hover:from-primaryRed/30 hover:from-20% hover:to-primaryPurple/30  hover:to-100% rounded-lg shadow hover:shadow-xl transition"
        >
          <FaFacebook className="text-blue-600 text-6xl mb-4" />
          <span className="text-lg font-semibold text-textBlack">Facebook</span>
        </Link>

        {/* Instagram Business Box */}
        <Link
          href="/instagram"
          className="flex flex-col items-center justify-center p-[6vw] bg-white hover:bg-gradient-to-br hover:from-primaryRed/30 hover:from-20% hover:to-primaryPurple/30  hover:to-100% rounded-lg shadow hover:shadow-xl transition"
        >
          <FaInstagram className="text-pink-500 text-6xl mb-4" />
          <span className="text-lg font-semibold text-textBlack">Instagram Business</span>
        </Link>

        {/* LinkedIn Business Box */}
        <Link
          href="/linkedin"
          className="flex flex-col items-center justify-center p-[6vw] bg-white hover:bg-gradient-to-br hover:from-primaryRed/30 hover:from-20%  hover:to-primaryPurple/30 hover:to-100% rounded-lg shadow hover:shadow-xl transition"
        >
          <FaLinkedin className="text-blue-700 text-6xl mb-4" />
          <span className="text-lg font-semibold text-textBlack">LinkedIn Business</span>
        </Link>
      </div>
    </div>
  );
}
