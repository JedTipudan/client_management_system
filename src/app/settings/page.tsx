'use client'
import { useState, useEffect } from 'react'
import { Type, Palette, Info } from 'lucide-react'

export default function SettingsPage() {
  const [fontSize, setFontSize] = useState('medium')
  const [fontFamily, setFontFamily] = useState('system')
  const [accentColor, setAccentColor] = useState('cyan')
  const [loaded, setLoaded] = useState(false)

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

  useEffect(() => {
    if (!loaded) return
    document.documentElement.style.fontSize = 
      fontSize === 'small' ? '14px' : 
      fontSize === 'large' ? '18px' : '16px'
    localStorage.setItem('appSettings', JSON.stringify({ fontSize, fontFamily, accentColor }))
  }, [fontSize, loaded])

  useEffect(() => {
    if (!loaded) return
    const fonts: Record<string, string> = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      inter: 'Inter, sans-serif',
      roboto: 'Roboto, sans-serif',
      poppins: 'Poppins, sans-serif'
    }
    document.body.style.fontFamily = fonts[fontFamily] || fonts.system
    localStorage.setItem('appSettings', JSON.stringify({ fontSize, fontFamily, accentColor }))
  }, [fontFamily, loaded])

  useEffect(() => {
    if (!loaded) return
    document.documentElement.setAttribute('data-accent', accentColor)
    const colors: Record<string, string> = {
      cyan: '#06b6d4',
      blue: '#3b82f6',
      green: '#22c55e',
      purple: '#a855f7',
      orange: '#f97316',
      red: '#ef4444'
    }
    document.documentElement.style.setProperty('--accent', colors[accentColor])
    localStorage.setItem('appSettings', JSON.stringify({ fontSize, fontFamily, accentColor }))
  }, [accentColor, loaded])

  if (!loaded) return <div>Loading...</div>

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Settings</h2>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Type className="text-cyan-400" size={24} />
          <h3 className="text-xl font-bold">Font Size</h3>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setFontSize('small')} className={`px-6 py-2 rounded-lg ${fontSize === 'small' ? 'bg-cyan-600' : 'bg-slate-700'} text-white font-bold`}>Small</button>
          <button onClick={() => setFontSize('medium')} className={`px-6 py-2 rounded-lg ${fontSize === 'medium' ? 'bg-cyan-600' : 'bg-slate-700'} text-white font-bold`}>Medium</button>
          <button onClick={() => setFontSize('large')} className={`px-6 py-2 rounded-lg ${fontSize === 'large' ? 'bg-cyan-600' : 'bg-slate-700'} text-white font-bold`}>Large</button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Type className="text-cyan-400" size={24} />
          <h3 className="text-xl font-bold">Font Style</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => setFontFamily('system')} className={`p-4 rounded-lg ${fontFamily === 'system' ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}>System</button>
          <button onClick={() => setFontFamily('inter')} className={`p-4 rounded-lg ${fontFamily === 'inter' ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}>Inter</button>
          <button onClick={() => setFontFamily('roboto')} className={`p-4 rounded-lg ${fontFamily === 'roboto' ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}>Roboto</button>
          <button onClick={() => setFontFamily('poppins')} className={`p-4 rounded-lg ${fontFamily === 'poppins' ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}>Poppins</button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="text-cyan-400" size={24} />
          <h3 className="text-xl font-bold">Accent Color</h3>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setAccentColor('cyan')} className={`w-12 h-12 rounded-full bg-cyan-500 ${accentColor === 'cyan' ? 'ring-4 ring-white' : ''}`} />
          <button onClick={() => setAccentColor('blue')} className={`w-12 h-12 rounded-full bg-blue-500 ${accentColor === 'blue' ? 'ring-4 ring-white' : ''}`} />
          <button onClick={() => setAccentColor('green')} className={`w-12 h-12 rounded-full bg-green-500 ${accentColor === 'green' ? 'ring-4 ring-white' : ''}`} />
          <button onClick={() => setAccentColor('purple')} className={`w-12 h-12 rounded-full bg-purple-500 ${accentColor === 'purple' ? 'ring-4 ring-white' : ''}`} />
          <button onClick={() => setAccentColor('orange')} className={`w-12 h-12 rounded-full bg-orange-500 ${accentColor === 'orange' ? 'ring-4 ring-white' : ''}`} />
          <button onClick={() => setAccentColor('red')} className={`w-12 h-12 rounded-full bg-red-500 ${accentColor === 'red' ? 'ring-4 ring-white' : ''}`} />
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Info className="text-cyan-400" size={24} />
          <h3 className="text-xl font-bold">About</h3>
        </div>
        <p className="text-slate-400">WiFi Manager v1.0</p>
      </div>
    </div>
  )
}