'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import { Poppins } from 'next/font/google'
import "./globals.css";
import Sidebar from "../components/Sidebar";
import SettingsProvider from "../components/SettingsProvider";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['400', '600', '700'],
});

// Note: Metadata is removed because this is now a Client Component
// If you need dynamic metadata, you should move it to a Server Component wrapper, 
// but for now the page title in browser tab might need to be set manually or via next.config.js

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // Define which routes are public (Login, Signup, etc.)
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password'

  useEffect(() => {
    const checkUser = async () => {
      // 1. Get the current user
      const { data: { user } } = await supabase.auth.getUser()

      // 2. Redirect logic
      if (!user && !isAuthPage) {
        // If no user and NOT on login page -> Go to Login
        router.push('/login')
      } else if (user && isAuthPage) {
        // If user IS logged in and trying to visit Login page -> Go to Dashboard
        router.push('/')
      } else {
        // Otherwise, allow access
        setLoading(false)
      }
    }

    checkUser()
  }, [pathname, router, isAuthPage])

  // Show a loading screen while checking
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Loading...
      </div>
    )
  }

  return (
    <html lang="en">
      <body className={poppins.className}>
        <SettingsProvider>
          <div className="flex min-h-screen relative">
            
            {/* Only show Sidebar if the user is logged in (not on login page) */}
            {!isAuthPage && <Sidebar />}
            
            <main className={`flex-1 p-4 md:p-8 w-full ${!isAuthPage ? 'md:ml-0' : ''}`}>
              {/* Background Logo */}
              <div 
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                  backgroundImage: "url('/logo.png')",
                  backgroundSize: '1000px',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  opacity: 0.08,
                }}
              />
              <div className="relative z-10">
                {children}
              </div>
            </main>
          </div>
        </SettingsProvider>
      </body>
    </html>
  )
}