'use client'
import { useState, useEffect } from 'react'
import { Settings, Type, Palette, Moon, Sun, Monitor } from 'lucide-react'

export default function SettingsPage() {
  const [fontSize, setFontSize] = useState('medium')
  const [fontFamily, setFontFamily] = useState('system')
  const [accentColor, setAccentColor] = useState('cyan')

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('appSettings')
    if (saved) {
      const settings = JSON.parse(saved)
      setFontSize(settings.fontSize || 'medium')
      setFontFamily(settings.fontFamily || 'system')
      setAccentColor(settings.accentColor || 'cyan')
    }
  }, [])

  // Save settings
  const saveSettings = (newSettings: any) => {
    localStorage.setItem('appSettings', JSON.stringify(newSettings))
    // Apply font size
    document.documentElement.style.fontSize = 
      newSettings.fontSize === 'small' ? '14px' : 
      newSettings.fontSize === 'large' ? '18px' : '16px'
    // Apply font family
    document.body.style.fontFamily = 
      newSettings.fontFamily === 'inter' ? 'Inter, sans-serif' :
      newSettings.fontFamily === 'roboto' ? 'Roboto, sans-serif' :
      newSettings.fontFamily === 'poppins' ? 'Poppins, sans-serif' :
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }

  const handleFontSizeChange = (size: string) => {
    setFontSize(size)
    saveSettings({ fontSize: size, fontFamily, accentColor })
  }

  const handleFontFamilyChange = (font: string) => {
    setFontFamily(font)
    saveSettings({ fontSize, fontFamily: font, accentColor })
  }

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color)
    saveSettings({ fontSize, fontFamily, accentColor: color })
  }

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
            onClick={() => handleFontSizeChange('small')}
            className={`px-4 py-2 rounded-lg ${fontSize === 'small' ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}
          >
            Small
          </button>
          <button 
            onClick={() => handleFontSizeChange('medium')}
            className={`px-4 py-2 rounded-lg ${fontSize === 'medium' ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}
          >
            Medium
          </button>
          <button 
            onClick={() => handleFontSizeChange('large')}
            className={`px-4 py-2 rounded-lg ${fontSize === 'large' ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}
          >
            Large
          </button>
        </div>
      </div>

      {/* Font Family */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Type className="text-cyan-400" size={24} />
          <h3 className="text-xl font-bold">Font Style</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => handleFontFamilyChange('system')}
            className={`p-3 rounded-lg ${fontFamily === 'system' ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            System Default
          </button>
          <button 
            onClick={() => handleFontFamilyChange('inter')}
            className={`p-3 rounded-lg ${fontFamily === 'inter' ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Inter
          </button>
          <button 
            onClick={() => handleFontFamilyChange('roboto')}
            className={`p-3 rounded-lg ${fontFamily === 'roboto' ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            Roboto
          </button>
          <button 
            onClick={() => handleFontFamilyChange('poppins')}
            className={`p-3 rounded-lg ${fontFamily === 'poppins' ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Poppins
          </button>
        </div>
      </div>

      {/* Accent Color */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="text-cyan-400" size={24} />
          <h3 className="text-xl font-bold">Accent Color</h3>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleAccentColorChange('cyan')}
            className={`w-12 h-12 rounded-full ${accentColor === 'cyan' ? 'ring-4 ring-white' : ''} bg-cyan-500`}
          />
          <button 
            onClick={() => handleAccentColorChange('blue')}
            className={`w-12 h-12 rounded-full ${accentColor === 'blue' ? 'ring-4 ring-white' : ''} bg-blue-500`}
          />
          <button 
            onClick={() => handleAccentColorChange('green')}
            className={`w-12 h-12 rounded-full ${accentColor === 'green' ? 'ring-4 ring-white' : ''} bg-green-500`}
          />
          <button 
            onClick={() => handleAccentColorChange('purple')}
            className={`w-12 h-12 rounded-full ${accentColor === 'purple' ? 'ring-4 ring-white' : ''} bg-purple-500`}
          />
          <button 
            onClick={() => handleAccentColorChange('orange')}
            className={`w-12 h-12 rounded-full ${accentColor === 'orange' ? 'ring-4 ring-white' : ''} bg-orange-500`}
          />
          <button 
            onClick={() => handleAccentColorChange('red')}
            className={`w-12 h-12 rounded-full ${accentColor === 'red' ? 'ring-4 ring-white' : ''} bg-red-500`}
          />
        </div>
      </div>

      {/* App Info */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-xl font-bold mb-2">About</h3>
        <p className="text-slate-400">WiFi Manager v1.0</p>
        <p className="text-slate-400 text-sm">Client Management System</p>
      </div>
    </div>
  )
}