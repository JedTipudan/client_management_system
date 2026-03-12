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

  // --- 1. AUTH CHECKING (Keep this as is) ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user && !isAuthPage) {
        router.push('/login')
      } else if (user && isAuthPage) {
        router.push('/')
      } else {
        setLoading(false)
      }
    }

    checkUser()
  }, [pathname, router, isAuthPage])

  // --- 2. SESSION TIMEOUT (ADD THIS HERE) ---
  useEffect(() => {
    // Skip timeout on auth pages
    if (isAuthPage) return

    const TIMEOUT_MINUTES = 10 // Set your desired timeout here
    const [timer, setTimer] = useState(TIMEOUT_MINUTES * 60)

    const resetTimer = () => {
      setTimer(TIMEOUT_MINUTES * 60)
    }

    // Listen for user activity
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('click', resetTimer)
    window.addEventListener('scroll', resetTimer)

    // Start the countdown
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          supabase.auth.signOut()
          router.push('/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      window.removeEventListener('click', resetTimer)
      window.removeEventListener('scroll', resetTimer)
      clearInterval(interval)
    }
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