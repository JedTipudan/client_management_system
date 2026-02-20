'use client'
import { useEffect, useState } from 'react'

export default function SettingsProvider({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Load and apply saved settings
    const saved = localStorage.getItem('appSettings')
    if (saved) {
      const settings = JSON.parse(saved)
      
      // Apply font size
      document.documentElement.style.fontSize = 
        settings.fontSize === 'small' ? '14px' : 
        settings.fontSize === 'large' ? '18px' : '16px'
    }
  }, [])

  if (!mounted) return null

  return <>{children}</>
}