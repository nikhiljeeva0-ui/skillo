"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SigninPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home/onboard
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0f0e0d] flex flex-col items-center justify-center p-4 text-center text-[#e8e2d9]">
      <div className="max-w-md w-full space-y-8">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#c9a84c] flex items-center justify-center text-[#0f0e0d] font-bold text-4xl mb-6 animate-pulse">
          S
        </div>
        <h1 className="text-2xl font-bold">Redirecting to Skillo...</h1>
        <p className="text-gray-400">Creating your session.</p>
      </div>
    </div>
  );
}
