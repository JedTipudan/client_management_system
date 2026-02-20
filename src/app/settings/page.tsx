'use client'
import { useState, useEffect } from 'react'
import { Type, Palette, Info } from 'lucide-react'

export default function SettingsPage() {
  const [fontSize, setFontSize] = useState('medium')
  const [fontFamily, setFontFamily] = useState('system')
  const [accentColor, setAccentColor] = useState('cyan')
  const [loaded, setLoaded] = useState(false)

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('appSettings')
    if (saved) {
      const settings = JSON.parse(saved)
      setFontSize(settings.fontSize || 'medium')
      setFontFamily(settings.fontFamily || 'system')
      setAccentColor(settings.accentColor || 'cyan')
    }
    setLoaded(true)
  }, [])

  // Apply font size immediately
  useEffect(() => {
    if (!loaded) return
    
    document.documentElement.style.fontSize = 
      fontSize === 'small' ? '14px' : 
      fontSize === 'large' ? '18px' : '16px'
    
    localStorage.setItem('appSettings', JSON.stringify({ fontSize, fontFamily, accentColor }))
  }, [fontSize, loaded])

  // Apply font family
  useEffect(() => {
    if (!loaded) return
    
    const fonts: any = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      inter: 'Inter, sans-serif',
      roboto: 'Roboto, sans-serif',
      poppins: 'Poppins, sans-serif'
    }
    document.body.style.fontFamily = fonts[fontFamily] || fonts.system
    localStorage.setItem('appSettings', JSON.stringify({ fontSize, fontFamily, accentColor }))
  }, [fontFamily, loaded])

  // Apply accent color (updates CSS variables)
  useEffect(() => {
    if (!loaded) return
    
    const colors: any = {
      cyan: '#06b6d4',
      blue: '#3b82f6',
      green: '#22c55e',
      purple: '#a855f7',
      orange: '#f97316',
      red: '#ef4444'
    }
    document.documentElement.style.setProperty('--accent-color', colors[accentColor] || colors.cyan)
    localStorage.setItem('appSettings', JSON.stringify({ fontSize, fontFamily, accentColor }))
  }, [accentColor, loaded])

  if (!loaded) return <div>Loading...</div>

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Settings</h2>

      {/* Font Size */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Type className="text-cyan-400" size={24} />
          <h3 className="text-xl font-bold">Font Size</h3>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setFontSize('small')}
            className={`px-6 py-2 rounded-lg ${fontSize === 'small' ? 'bg-cyan-600' : 'bg-slate-700'} text-white font-bold`}
          >
            Small
          </button>
          <button 
            onClick={() => setFontSize('medium')}
            className={`px-6 py-2 rounded-lg ${fontSize === 'medium' ? 'bg-cyan-600' : 'bg-slate-700'} text-white font-bold`}
          >
            Medium
          </button>
          <button 
            onClick={() => setFontSize('large')}
            className={`px-6 py-2 rounded-lg ${fontSize === 'large' ? 'bg-cyan-600' : 'bg-slate-700'} text-white font-bold`}
          >
            Large
          </button>
        </div>
        <p className="text-slate-400 mt-2 text-sm">Current: {fontSize}</p>
      </div>

      {/* Font Family */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Type className="text-cyan-400" size={24} />
          <h3 className="text-xl font-bold">Font Style</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'system', name: 'System', style: 'system-ui' },
            { id: 'inter', name: 'Inter', style: 'Inter, sans-serif' },
            { id: 'roboto', name: 'Roboto', style: 'Roboto, sans-serif' },
            { id: 'poppins', name: 'Poppins', style: 'Poppins, sans-serif' }
          ].map((font) => (
            <button 
              key={font.id}
              onClick={() => setFontFamily(font.id)}
              className={`p-4 rounded-lg text-center ${fontFamily === font.id ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}
              style={{ fontFamily: font.style }}
            >
              {font.name}
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="text-cyan-400" size={24} />
          <h3 className="text-xl font-bold">Accent Color</h3>
        </div>
        <div className="flex gap-4">
          {[
            { id: 'cyan', color: 'bg-cyan-500' },
            { id: 'blue', color: 'bg-blue-500' },
            { id: 'green', color: 'bg-green-500' },
            { id: 'purple', color: 'bg-purple-500' },
            { id: 'orange', color: 'bg-orange-500' },
            { id: 'red', color: 'bg-red-500' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setAccentColor(item.id)}
              className={`w-12 h-12 rounded-full ${item.color} ${accentColor === item.id ? 'ring-4 ring-white' : ''} transition-transform hover:scale-110`}
            />
          ))}
        </div>
        <p className="text-slate-400 mt-2 text-sm">Current: {accentColor}</p>
      </div>

      {/* Info */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Info className="text-cyan-400" size={24} />
          <h3 className="text-xl font-bold">About</h3>
        </div>
        <p className="text-slate-400">WiFi Manager v1.0</p>
        <p className="text-slate-400 text-sm">Settings are saved automatically</p>
      </div>
    </div>
  )
}