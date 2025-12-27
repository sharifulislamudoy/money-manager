"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useEffect } from "react";

function HomePageContent() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect to manager if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/manager");
    }
  }, [status, router]);

  const handleStart = () => {
    router.push("/auth/signin");
  };

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Money Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your BDT and USD easily
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            What you can do:
          </h2>
          
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300">Add money in BDT or USD</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300">Subtract money</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300">See transaction history</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300">Switch between currencies</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                <span className="text-sm">🔒</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300">Secure Google authentication</span>
            </li>
          </ul>

          <button
            onClick={handleStart}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign in with Google to Start
          </button>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Simple • Free • Private • Secure</p>
          <p className="mt-1">Your data is stored locally in your browser</p>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}