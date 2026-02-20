import Link from 'next/link'
import { Home, Users, Calendar, MapPin } from 'lucide-react'

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 min-h-screen p-4">
      <h1 className="text-xl font-bold text-white mb-8">WiFi Manager</h1>
      <nav className="space-y-2">
        <Link href="/" className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-slate-800 rounded-lg">
          <Home size={20} /> Dashboard
        </Link>
        <Link href="/clients" className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-slate-800 rounded-lg">
          <Users size={20} /> Clients
        </Link>
        <Link href="/due-dates" className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-slate-800 rounded-lg">
          <Calendar size={20} /> Due Dates
        </Link>
        <Link href="/locations" className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-slate-800 rounded-lg">
          <MapPin size={20} /> Locations
        </Link>
      </nav>
    </div>
  )
}