import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import EmailJSInit from "./emailjs-init";
import { DarkModeProvider } from "./DarkModeContext";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Youtube-upl Uploader",
  description: "Manage and schedule your social media posts",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-900`}>
        <DarkModeProvider>
          <SessionProvider>
            <EmailJSInit />
            <Toaster position="top-right" />
            {children}
          </SessionProvider>
        </DarkModeProvider>
      </body>
    </html>
  );
}
