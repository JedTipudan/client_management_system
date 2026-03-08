'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Users, DollarSign, Calendar, AlertCircle, Plus, Clock, RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [clients, setClients] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [animateNumbers, setAnimateNumbers] = useState(false)

  // --- Admin Logic ---
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const userData = data.user
      setUser(userData)
      if (userData?.email) {
        setIsAdmin(['ronnelpaciano.1986@gmail.com'].includes(userData.email.toLowerCase()))
      }
    })
  }, [])

  // Combined fetchData function
  const fetchData = async () => {
    setLoading(true)
    const { data: clientsData } = await supabase.from('clients').select('*, plans(price)').order('created_at', { ascending: false })
    const { data: plansData } = await supabase.from('plans').select('*')
    setClients(clientsData || [])
    setPlans(plansData || [])
    setLoading(false)
    // Trigger number animation after data loads
    setTimeout(() => setAnimateNumbers(true), 100)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const calculateDueDate = (installDate: string) => {
    if (!installDate) return ''
    const [year, month, day] = installDate.split('-').map(Number)
    
    let newMonth = month + 1
    let newYear = year
    
    if (newMonth > 12) {
      newMonth = 1
      newYear = year + 1
    }

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
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1
    }
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
    
    if (dueDateObj > today) {
      return { text: 'Paid', color: 'bg-green-500/10 text-green-500' }
    }
    
    if (monthsOverdue >= 1) {
      return { text: 'Unsettled', color: 'bg-orange-500/10 text-orange-500' }
    }
    
    return { text: 'Unpaid', color: 'bg-red-500/10 text-red-500' }
  }

  const totalClients = clients.length
  const paidClients = clients.filter(c => getPaymentStatus(c).text === 'Paid').length
  const unpaidClients = clients.filter(c => getPaymentStatus(c).text === 'Unpaid').length
  const unsettledClients = clients.filter(c => getPaymentStatus(c).text === 'Unsettled').length

  const recentClients = clients.slice(0, 5)

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const upcomingDue = clients
    .filter(c => {
      const dueDate = getDueDate(c)
      if (!dueDate) return false
      const todayStr = getTodayStr()
      return dueDate >= todayStr && dueDate <= nextWeek.toISOString().split('T')[0]
    })
    .slice(0, 5)

  // Animated number counter
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

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold animate-slide-in">Dashboard Overview</h2>
        <button 
          onClick={fetchData} 
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Clients Card */}
        <div className="group relative p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-blue-100 text-sm">Total Clients</p>
              <h3 className="text-4xl font-bold mt-2 animate-count-up">
                <AnimatedNumber value={totalClients} />
              </h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform duration-300">
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* Paid Card */}
        <div className="group relative p-6 bg-gradient-to-br from-green-600 to-green-700 rounded-xl text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-green-100 text-sm">Paid</p>
              <h3 className="text-4xl font-bold mt-2 animate-count-up">
                <AnimatedNumber value={paidClients} />
              </h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform duration-300">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        {/* Unpaid Card */}
        <div className="group relative p-6 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-red-100 text-sm">Unpaid</p>
              <h3 className="text-4xl font-bold mt-2 animate-count-up">
                <AnimatedNumber value={unpaidClients} />
              </h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform duration-300">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        {/* Unsettled Card */}
        <div className="group relative p-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-orange-100 text-sm">Unsettled</p>
              <h3 className="text-4xl font-bold mt-2 animate-count-up">
                <AnimatedNumber value={unsettledClients} />
              </h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform duration-300">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Only: Action Buttons */}
      {isAdmin && (
        <div className="flex gap-4 mb-8">
          <Link 
            href="/clients" 
            className="group flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> Add Client
          </Link>
          <Link 
            href="/due-dates" 
            className="group flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-slate-500/30"
          >
            <Clock size={20} className="group-hover:rotate-180 transition-transform duration-300" /> View Due Dates
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="group bg-transparent backdrop-blur-sm rounded-xl border border-white/10 p-6 transition-all duration-300 hover:shadow-xl hover:border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp size={20} className="text-green-400" /> Recent Clients
            </h3>
            <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
              {recentClients.length} total
            </span>
          </div>
          {recentClients.length === 0 ? (
            <p className="text-slate-400">No clients yet</p>
          ) : (
            <div className="space-y-3">
              {recentClients.map((client: any, index: number) => (
                <div 
                  key={client.id} 
                  className="group/item flex justify-between items-center p-3 bg-white/10 rounded-lg transition-all duration-300 hover:bg-white/20 hover:scale-102 hover:shadow-lg cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold">
                      {client.client_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium group-hover/item:text-cyan-300 transition-colors">{client.client_name}</p>
                      <p className="text-sm text-slate-400">{client.location}</p>
                    </div>
                  </div>
                  <span className="text-cyan-300 font-bold group-hover/item:scale-110 transition-transform">₱{client.plans?.price || 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Due Dates */}
        <div className="group bg-transparent backdrop-blur-sm rounded-xl border border-white/10 p-6 transition-all duration-300 hover:shadow-xl hover:border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity size={20} className="text-yellow-400" /> Upcoming Due Dates
            </h3>
            <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
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
                  className="group/item flex justify-between items-center p-3 bg-white/10 rounded-lg transition-all duration-300 hover:bg-white/20 hover:scale-102 hover:shadow-lg cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold">
                      {client.client_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium group-hover/item:text-yellow-300 transition-colors">{client.client_name}</p>
                      <p className="text-sm text-slate-400">{client.location}</p>
                    </div>
                  </div>
                  <span className="text-yellow-300 font-medium group-hover/item:scale-110 transition-transform">{getDueDate(client)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}