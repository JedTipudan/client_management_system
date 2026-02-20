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
      
      // Apply accent color
      const colors = {
        cyan: '#06b6d4',
        blue: '#3b82f6',
        green: '#22c55e',
        purple: '#a855f7',
        orange: '#f97316',
        red: '#ef4444'
      }
      const accentColor = colors[settings.accentColor] || colors.cyan
      document.documentElement.style.setProperty('--accent', accentColor)
      document.documentElement.style.setProperty('--accent-bg', accentColor + '20')
    }
  }, [])

  if (!mounted) return null

  return <>{children}</>
}