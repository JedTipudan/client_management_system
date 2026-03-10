'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  Users, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  RefreshCw, 
  TrendingUp, 
  Activity,
  CheckCircle,
  X,
  Search,
  MapPin
} from 'lucide-react'
import Link from 'next/link'

// --- Toast Notification Component ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-xl animate-slide-up ${
      type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
    }`}>
      <div className={`p-1 rounded-full ${type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
        {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      </div>
      <span className="text-sm font-semibold tracking-wide">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
        <X size={14} />
      </button>
    </div>
  )
}

export default function Dashboard() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [animateNumbers, setAnimateNumbers] = useState(false)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [lastSync, setLastSync] = useState<Date>(new Date())
  const [searchQuery, setSearchQuery] = useState('')

  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // --- Supabase Auth & Realtime ---
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const userData = data.user
      setUser(userData)
      if (userData?.email) {
        setIsAdmin(['ronnelpaciano.1986@gmail.com'].includes(userData.email.toLowerCase()))
      }
    })
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('dashboard_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
        fetchData()
        setLastSync(new Date())
        setIsLive(true)
        setTimeout(() => setIsLive(false), 2000)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // --- Data Fetching ---
  const fetchData = async () => {
    setLoading(true)
    const { data: clientsData } = await supabase.from('clients').select('*, plans(price)').order('created_at', { ascending: false })
    setClients(clientsData || [])
    setLoading(false)
    setLastSync(new Date())
    setTimeout(() => setAnimateNumbers(true), 100)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- Helpers ---
  const calculateDueDate = (installDate: string) => {
    if (!installDate) return ''
    const [year, month, day] = installDate.split('-').map(Number)
    let newMonth = month + 1
    let newYear = year
    if (newMonth > 12) { newMonth = 1; newYear = year + 1 }
    const daysInNewMonth = new Date(newYear, newMonth, 0).getDate()
    const finalDay = Math.min(day, daysInNewMonth)
    return `${newYear}-${String(newMonth).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}`
  }

  const getDueDate = (client: any) => {
    if (client.due_date) return client.due_date
    if (client.installation_date) return calculateDueDate(client.installation_date)
    return ''
  }

  const getCurrentYearMonth = () => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() + 1 }
  }

  const getTodayStr = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getPaymentStatus = (client: any): { text: string; color: string } => {
    const dueDate = getDueDate(client)
    if (!dueDate) return { text: 'Unpaid', color: 'bg-red-500/10 text-red-500' }
    
    const todayStr = getTodayStr()
    const today = new Date(todayStr + 'T00:00:00')
    const dueDateObj = new Date(dueDate + 'T00:00:00')
    
    const todayYearMonth = getCurrentYearMonth()
    const [dueYear, dueMonth] = dueDate.split('-').map(Number)
    const monthsOverdue = (todayYearMonth.year - dueYear) * 12 + (todayYearMonth.month - dueMonth)
    
    if (dueDateObj > today) return { text: 'Paid', color: 'bg-green-500/10 text-green-500' }
    if (monthsOverdue >= 1) return { text: 'Unsettled', color: 'bg-orange-500/10 text-orange-500' }
    return { text: 'Unpaid', color: 'bg-red-500/10 text-red-500' }
  }

  // --- Stats ---
  const stats = useMemo(() => ({
    totalClients: clients.length,
    paidClients: clients.filter(c => getPaymentStatus(c).text === 'Paid').length,
    unpaidClients: clients.filter(c => getPaymentStatus(c).text === 'Unpaid').length,
    unsettledClients: clients.filter(c => getPaymentStatus(c).text === 'Unsettled').length,
    activeClients: clients.filter(c => c.status === 'active').length,
    inactiveClients: clients.filter(c => c.status === 'inactive').length,
    totalRevenue: clients.reduce((acc, c) => acc + (c.plans?.price || 0), 0),
  }), [clients])

  const recentClients = useMemo(() => clients.slice(0, 5), [clients])

  // --- UPDATED LOGIC: Next 2 Days & Sorted Small to Big ---
  const upcomingDue = useMemo(() => {
    const today = new Date()
    const nextTwoDays = new Date(today)
    nextTwoDays.setDate(today.getDate() + 2)
    
    const nextTwoDaysStr = nextTwoDays.toISOString().split('T')[0]
    const todayStr = getTodayStr()

    return clients
      .filter(c => {
        const dueDate = getDueDate(c)
        if (!dueDate) return false
        return dueDate >= todayStr && dueDate <= nextTwoDaysStr
      })
      .sort((a, b) => {
        const dateA = getDueDate(a)
        const dateB = getDueDate(b)
        return new Date(dateA).getTime() - new Date(dateB).getTime()
      })
      .slice(0, 5)
  }, [clients])

  const filteredRecentClients = useMemo(() => {
    if (!searchQuery) return recentClients
    return recentClients.filter(c => 
      c.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [recentClients, searchQuery])

  // --- Animated Number Counter ---
  const AnimatedNumber = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
    const [displayValue, setDisplayValue] = useState(0)
    
    useEffect(() => {
      if (!animateNumbers) return
      let start = 0
      const end = value
      const increment = end / (duration / 16)
      const timer = setInterval(() => {
        start += increment
        if (start >= end) {
          setDisplayValue(end)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(start))
        }
      }, 16)
      return () => clearInterval(timer)
    }, [value, duration, animateNumbers])
    
    return <span>{displayValue}</span>
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Live Connection Indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`relative flex h-3 w-3`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? 'bg-green-400' : 'bg-slate-600'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isLive ? 'bg-green-500' : 'bg-slate-500'}`}></span>
          </div>
          <span className="text-sm font-medium text-slate-400">
            {isLive ? 'Live Updates' : 'Connected'}
          </span>
        </div>
        <div className="text-xs text-slate-500">
          Last Sync: {lastSync.toLocaleTimeString()}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Dashboard Overview
          </h2>
          <p className="text-slate-400 mt-1">Real-time insights and analytics</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData} 
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-lg border border-slate-700"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="group relative p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-blue-100 text-sm">Total Clients</p>
              <h3 className="text-4xl font-bold mt-2">
                <AnimatedNumber value={stats.totalClients} />
              </h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform duration-300">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="group relative p-6 bg-gradient-to-br from-green-600 to-green-700 rounded-xl text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-green-100 text-sm">Paid</p>
              <h3 className="text-4xl font-bold mt-2">
                <AnimatedNumber value={stats.paidClients} />
              </h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform duration-300">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="group relative p-6 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-red-100 text-sm">Unpaid</p>
              <h3 className="text-4xl font-bold mt-2">
                <AnimatedNumber value={stats.unpaidClients} />
              </h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform duration-300">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="group relative p-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-orange-100 text-sm">Unsettled</p>
              <h3 className="text-4xl font-bold mt-2">
                <AnimatedNumber value={stats.unsettledClients} />
              </h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform duration-300">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>
            {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all backdrop-blur-sm"
          />
        </div>
      </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="group bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-6 transition-all duration-300 hover:shadow-xl hover:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp size={20} className="text-green-400" /> Recent Clients
            </h3>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
              {filteredRecentClients.length} total
            </span>
          </div>
          {filteredRecentClients.length === 0 ? (
            <p className="text-slate-400">No clients found</p>
          ) : (
            <div className="space-y-3">
              {filteredRecentClients.map((client: any, index: number) => (
                <div 
                  key={client.id} 
                  className="group/item flex justify-between items-center p-3 bg-slate-800/50 rounded-lg transition-all duration-300 hover:bg-slate-800 hover:scale-102 hover:shadow-lg cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
                      {client.client_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium group-hover/item:text-cyan-300 transition-colors">{client.client_name}</p>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <MapPin size={12} /> {client.location || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <span className="text-cyan-300 font-bold group-hover/item:scale-110 transition-transform">₱{client.plans?.price || 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Due Dates */}
        <div className="group bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-6 transition-all duration-300 hover:shadow-xl hover:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity size={20} className="text-yellow-400" /> Upcoming Due Dates
            </h3>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
              {upcomingDue.length} total
            </span>
          </div>
          {upcomingDue.length === 0 ? (
            <p className="text-slate-400">No upcoming due dates</p>
          ) : (
            <div className="space-y-3">
              {upcomingDue.map((client: any, index: number) => (
                <div 
                  key={client.id} 
                  className="group/item flex justify-between items-center p-3 bg-slate-800/50 rounded-lg transition-all duration-300 hover:bg-slate-800 hover:scale-102 hover:shadow-lg cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-yellow-500/20">
                      {client.client_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium group-hover/item:text-yellow-300 transition-colors">{client.client_name}</p>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <MapPin size={12} /> {client.location || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <span className="text-yellow-300 font-medium group-hover/item:scale-110 transition-transform">{getDueDate(client)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Active Clients</p>
              <p className="text-2xl font-bold text-white">{stats.activeClients}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <X size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Inactive Clients</p>
              <p className="text-2xl font-bold text-white">{stats.inactiveClients}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <DollarSign size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white">₱{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  )
}