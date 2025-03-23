"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Home() {
  const router = useRouter();
  const { status, data: session } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.googleConnected) {
      router.push("/upload");
    } else {
      router.push("/connect-google");
    }
  }, [status, session, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
