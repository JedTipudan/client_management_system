'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, MapPin, Settings, Menu, X, Tag, LogIn, LogOut, User } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/clients', icon: Users, label: 'Clients' },
    { href: '/due-dates', icon: Calendar, label: 'Due Dates' },
    { href: '/locations', icon: MapPin, label: 'Locations' },
    { href: '/plans', icon: Tag, label: 'Plans' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg text-white"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-slate-900 min-h-screen p-4
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <h1 className="text-xl font-bold text-white text-center mb-6 mt-12 md:mt-0" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Brylle's Network<br/>
          <span className="text-white text-sm font-normal">& Data Solutions</span>
        </h1>
        
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Login/Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          {user ? (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
            >
              <LogOut size={20} />
              Logout
            </button>
          ) : (
            <Link 
              href="/login"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 transition"
            >
              <LogIn size={20} />
              Login
            </Link>
          )}
        </div>
      </div>
    </>
  )
}