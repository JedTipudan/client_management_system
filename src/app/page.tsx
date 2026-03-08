'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Users, DollarSign, Calendar, AlertCircle, Plus, Clock, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [clients, setClients] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  // FIXED: Match DueDatesPage logic (using months, not days)
  const getPaymentStatus = (client: any): { text: string; color: string } => {
    const dueDate = getDueDate(client)
    if (!dueDate) return { text: 'Unpaid', color: 'bg-red-500/10 text-red-500' }
    
    const todayStr = getTodayStr()
    const today = new Date(todayStr + 'T00:00:00')
    const dueDateObj = new Date(dueDate + 'T00:00:00')
    
    const todayYearMonth = getCurrentYearMonth()
    const [dueYear, dueMonth] = dueDate.split('-').map(Number)
    
    const monthsOverdue = (todayYearMonth.year - dueYear) * 12 + (todayYearMonth.month - dueMonth)
    
    // If due date is in the FUTURE → Paid (already paid for this month)
    if (dueDateObj > today) {
      return { text: 'Paid', color: 'bg-green-500/10 text-green-500' }
    }
    
    // If due date has passed and overdue by 1+ months → Unsettled
    if (monthsOverdue >= 1) {
      return { text: 'Unsettled', color: 'bg-orange-500/10 text-orange-500' }
    }
    
    // If due date has passed (same month) → Unpaid (not yet paid for this month)
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Dashboard Overview</h2>
        <button onClick={fetchData} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm">Total Clients</p>
              <h3 className="text-4xl font-bold mt-2">{totalClients}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-600 to-green-700 rounded-xl text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm">Paid</p>
              <h3 className="text-4xl font-bold mt-2">{paidClients}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-100 text-sm">Unpaid</p>
              <h3 className="text-4xl font-bold mt-2">{unpaidClients}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-100 text-sm">Unsettled</p>
              <h3 className="text-4xl font-bold mt-2">{unsettledClients}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Only: Action Buttons */}
      {isAdmin && (
        <div className="flex gap-4 mb-8">
          <Link href="/clients" className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-lg font-semibold transition">
            <Plus size={20} /> Add Client
          </Link>
          <Link href="/due-dates" className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition">
            <Clock size={20} /> View Due Dates
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-transparent backdrop-blur-sm backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-xl font-bold mb-4">Recent Clients</h3>
          {recentClients.length === 0 ? (
            <p className="text-slate-400">No clients yet</p>
          ) : (
            <div className="space-y-3">
              {recentClients.map((client: any) => (
                <div key={client.id} className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                  <div>
                    <p className="font-medium">{client.client_name}</p>
                    <p className="text-sm text-slate-400">{client.location}</p>
                  </div>
                  <span className="text-cyan-300 font-bold">₱{client.plans?.price || 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-transparent backdrop-blur-sm backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-xl font-bold mb-4">Upcoming Due Dates</h3>
          {upcomingDue.length === 0 ? (
            <p className="text-slate-400">No upcoming due dates</p>
          ) : (
            <div className="space-y-3">
              {upcomingDue.map((client: any) => (
                <div key={client.id} className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                  <div>
                    <p className="font-medium">{client.client_name}</p>
                    <p className="text-sm text-slate-400">{client.location}</p>
                  </div>
                  <span className="text-yellow-300 font-medium">{getDueDate(client)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}