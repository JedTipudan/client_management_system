import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { LayoutDashboard, Users, CalendarDays } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = { title: 'WiFi ISP Manager' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex h-screen bg-slate-900 text-slate-100`}>
        <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <h1 className="text-2xl font-bold text-cyan-400">ISP<span className="text-white">Manager</span></h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-cyan-400 rounded-lg transition">
              <LayoutDashboard size={20} /> Dashboard
            </Link>
            <Link href="/clients" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-cyan-400 rounded-lg transition">
              <Users size={20} /> Clients
            </Link>
            <Link href="/due-dates" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-cyan-400 rounded-lg transition">
              <CalendarDays size={20} /> Due Dates
            </Link>
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-8 bg-slate-900">{children}</main>
      </body>
    </html>
  )
}