'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function SessionTimeoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [timer, setTimer] = useState(600) // 10 minutes

  useEffect(() => {
    let activityTimer: NodeJS.Timeout

    const resetTimer = () => {
      setTimer(600)
      clearTimeout(activityTimer)
      activityTimer = setTimeout(() => {
        supabase.auth.signOut()
        router.push('/login')
      }, 600 * 1000)
    }

    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('click', resetTimer)
    window.addEventListener('scroll', resetTimer)

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
      clearTimeout(activityTimer)
    }
  }, [router])

  return <>{children}</>
}