"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home/onboard since this is a tutor-first app
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-4 text-center text-[var(--text)]">
      <div className="max-w-md w-full space-y-8">
        <div className="w-20 h-20 mx-auto rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--bg)] font-bold text-4xl mb-6 animate-pulse">
          S
        </div>
        <h1 className="text-2xl font-bold">Redirecting to Skillo...</h1>
        <p className="text-[var(--muted)]">Authenticating your session.</p>
      </div>
    </div>
  );
}
