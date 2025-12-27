"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useSearchParams } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  // Check for success parameter from Google login
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true' && status === 'authenticated') {
      // Small delay to ensure page is loaded
      setTimeout(() => {
        toast.success(
          <div>
            <p className="font-semibold">Login Successful! 🎉</p>
            <p className="text-sm">Welcome, {session?.user?.name}!</p>
          </div>,
          {
            duration: 4000,
            icon: '✅',
            style: {
              background: '#10B981',
              color: 'white',
            }
          }
        );
      }, 500);
    }
  }, [status, searchParams, session]);

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
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-black dark:to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Hero Section */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl text-white font-bold">💰</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Money Manager Pro
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Smart BDT & USD Tracker
              </p>
            </div>
          </div>

          {/* Features Card */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 dark:border-gray-800 animate-slide-up">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-blue-500">✨</span>
                Premium Features
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">Dual Currency Support</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Track both BDT and USD with real-time conversion
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                    <span className="text-white text-sm">📊</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">Transaction History</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Full history with detailed descriptions and timestamps
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                    <span className="text-white text-sm">⚡</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">Quick Actions</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      One-click amounts and instant operations
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                    <span className="text-white text-sm">🔒</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">Secure & Private</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Google authentication with encrypted data storage
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                    <span className="text-white text-sm">📱</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">Cross-Platform</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Access from any device with responsive design
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleStart}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-3 group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="text-lg">Get Started with Google</span>
            </button>
          </div>

          {/* Stats & Info */}
          <div className="text-center">
            <div className="inline-flex items-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">100%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Free</div>
              </div>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">24/7</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Access</div>
              </div>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">∞</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Transactions</div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Trusted by users worldwide • No credit card required • Start tracking in seconds
            </p>
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.2s both;
        }
      `}</style>
    </>
  );
}