"use client";

import { useEffect } from "react";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: any;
}) {
  useEffect(() => {
    // Check for the session-updated cookie
    const sessionUpdated = document.cookie.includes(
      "next-auth.session-updated=true"
    );

    if (sessionUpdated) {
      // Clear the cookie
      document.cookie = "next-auth.session-updated=; path=/; max-age=0";

      // Force a hard refresh to update everything
      window.location.reload();
    }
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
