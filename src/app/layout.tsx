'use client'

import { useEffect, useState, useRef } from 'react'
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
  
  // 1. Initialize timer state
  const [timer, setTimer] = useState(600) // 10 minutes default
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Define which routes are public
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password'

  // --- 1. AUTH CHECKING ---
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

  // --- 2. SESSION TIMEOUT (FIXED) ---
  useEffect(() => {
    // Skip timeout on auth pages
    if (isAuthPage) return

    const TIMEOUT_SECONDS = 600 // 10 minutes

    // 2.1 Reset timer when entering a protected route
    // This ensures a fresh session start when logging in or navigating to protected pages
    setTimer(TIMEOUT_SECONDS)

    const resetTimer = () => {
      setTimer(TIMEOUT_SECONDS)
    }

    // 2.2 Listen for user activity (Added touch events for mobile)
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('click', resetTimer)
    window.addEventListener('scroll', resetTimer)
    window.addEventListener('touchstart', resetTimer)
    window.addEventListener('touchmove', resetTimer)

    // 2.3 Start the countdown
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          supabase.auth.signOut()
          router.push('/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      // Cleanup listeners
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      window.removeEventListener('click', resetTimer)
      window.removeEventListener('scroll', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
      window.removeEventListener('touchmove', resetTimer)
      
      // Cleanup interval
      if (intervalRef.current) clearInterval(intervalRef.current)
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