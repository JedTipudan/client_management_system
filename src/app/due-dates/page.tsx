'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { 
  CheckCircle, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Search, 
  Bell, 
  Zap, 
  Clock, 
  AlertCircle,
  X,
  Activity
} from 'lucide-react'

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

// --- Skeleton Loader Component ---
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-8 py-5"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-slate-700/50 rounded-full"></div><div className="h-5 bg-slate-700/50 rounded w-40"></div></div></td>
    <td className="px-8 py-5"><div className="h-5 bg-slate-700/50 rounded w-32"></div></td>
    <td className="px-8 py-5"><div className="h-5 bg-slate-700/50 rounded w-28"></div></td>
    <td className="px-8 py-5"><div className="h-5 bg-slate-700/50 rounded w-32"></div></td>
    <td className="px-8 py-5"><div className="h-5 bg-slate-700/50 rounded w-32"></div></td>
    <td className="px-8 py-5"><div className="h-5 bg-slate-700/50 rounded w-24"></div></td>
    <td className="px-8 py-5"><div className="flex justify-end gap-2"><div className="h-9 w-9 bg-slate-700/50 rounded"></div></div></td>
  </tr>
)

export default function DueDatesPage() {
  const [clients, setClients] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('unpaid')
  const [locFilter, setLocFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [lastSync, setLastSync] = useState<Date>(new Date())

  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // --- Helpers ---
  const getCurrentYearMonth = () => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() + 1 }
  }

  const getTodayDay = () => new Date().getDate()

  const getTodayStr = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

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

  // Realtime Subscription for "Live" Feel
  useEffect(() => {
    const channel = supabase
      .channel('due_dates_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
        console.log('Change received!', payload)
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

  const fetchData = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('clients').select('*, plans(name, price)').order('client_name')
    setClients(data || [])
    setIsLoading(false)
    setLastSync(new Date())
  }

  useEffect(() => { fetchData() }, [])

  // --- Logic ---
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

  const getDueDate = (client: any) => client.due_date || calculateDueDate(client.installation_date) || ''

  const getDaysRemaining = (dueDateStr: string) => {
    if (!dueDateStr) return null
    const today = new Date(getTodayStr())
    const due = new Date(dueDateStr)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getOriginalDueDay = (client: any) => {
    // Get the original installation day as the "true" due day
    if (client.installation_date) {
      const [, , day] = client.installation_date.split('-').map(Number)
      return day
    }
    return null
  }

  const getPaymentStatus = (client: any) => {
    const dueDate = getDueDate(client)
    if (!dueDate) return { text: 'Pending', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
    
    const todayStr = getTodayStr()
    const today = new Date(todayStr + 'T00:00:00')
    const dueDateObj = new Date(dueDate + 'T00:00:00')
    
    const todayYearMonth = getCurrentYearMonth()
    const [dueYear, dueMonth, dueDay] = dueDate.split('-').map(Number)
    const monthsOverdue = (todayYearMonth.year - dueYear) * 12 + (todayYearMonth.month - dueMonth)
    
    if (dueDateObj > today) return { text: 'Paid', color: 'bg-green-500/10 text-green-400 border-green-500/20' }
    
    // Get the original due day from installation date
    const originalDueDay = getOriginalDueDay(client)
    const daysInCurrentMonth = new Date(todayYearMonth.year, todayYearMonth.month, 0).getDate()
    
    // If original due day doesn't exist in current month and we're past the due month, show as Unsettled
    if (originalDueDay && originalDueDay > daysInCurrentMonth && monthsOverdue >= 1) {
      return { text: 'Unsettled', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' }
    }
    
    // If original due day doesn't exist in current month, hide it (show as Paid)
    if (originalDueDay && originalDueDay > daysInCurrentMonth) {
      return { text: 'Paid', color: 'bg-green-500/10 text-green-400 border-green-500/20' }
    }
    
    if (monthsOverdue >= 1) return { text: 'Unsettled', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' }
    return { text: 'Unpaid', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
  }

  const isDueDateInCurrentMonth = (dateStr: string, client: any) => {
    const todayStr = getTodayStr()
    const today = new Date(todayStr + 'T00:00:00')
    const dueDate = new Date(dateStr + 'T00:00:00')
    
    // Get the original due day from installation date
    const originalDueDay = getOriginalDueDay(client)
    
    // Check if original due day exists in current month
    const todayYearMonth = getCurrentYearMonth()
    const daysInCurrentMonth = new Date(todayYearMonth.year, todayYearMonth.month, 0).getDate()
    
    // If original due day doesn't exist in current month, don't show as unpaid
    if (originalDueDay && originalDueDay > daysInCurrentMonth) {
      return false
    }
    
    return dueDate <= today
  }

  // --- Filtering & Sorting ---
  const filteredClients = useMemo(() => {
    let data = clients.filter((c: any) => c.installation_date || c.due_date)
    
    // Search
    if (searchQuery) {
      data = data.filter((c: any) => c.client_name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Location
    if (locFilter !== 'All') {
      data = data.filter((c: any) => c.location === locFilter)
    }

    // Status
    data = data.filter((c: any) => {
      const status = getPaymentStatus(c)
      const dueDate = getDueDate(c)
      if (statusFilter === 'all') return true
      if (statusFilter === 'paid') return status.text === 'Paid'
      if (statusFilter === 'unsettled') return status.text === 'Unsettled'
      if (statusFilter === 'unpaid') return status.text === 'Unpaid' && isDueDateInCurrentMonth(dueDate, c)
      return true
    })

    // Sort: Urgency (Unpaid/Unsettled first, then by Date)
    return data.sort((a, b) => {
      const statusA = getPaymentStatus(a).text
      const statusB = getPaymentStatus(b).text
      if (statusA === 'Unsettled' && statusB !== 'Unsettled') return -1
      if (statusB === 'Unsettled' && statusA !== 'Unsettled') return 1
      if (statusA === 'Unpaid' && statusB !== 'Unpaid') return -1
      if (statusB === 'Unpaid' && statusA !== 'Unpaid') return 1
      
      const dateA = a.installation_date || a.due_date || ''
      const dateB = b.installation_date || b.due_date || ''
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    })
  }, [clients, statusFilter, locFilter, searchQuery])

  const totalItems = filteredClients.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const currentData = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => { setCurrentPage(1) }, [statusFilter, locFilter, searchQuery])

  const stats = useMemo(() => ({
    paid: clients.filter(c => getPaymentStatus(c).text === 'Paid').length,
    unpaid: clients.filter(c => getPaymentStatus(c).text === 'Unpaid').length,
    unsettled: clients.filter(c => getPaymentStatus(c).text === 'Unsettled').length,
  }), [clients])

  const uniqueLocations = useMemo(() => [...new Set(clients.map(c => c.location).filter(Boolean))], [clients])

  const handleMarkAsPaid = async (client: any) => {
    const currentDueDate = getDueDate(client)
    if (!currentDueDate) return

    // Use original installation day, not the due date day
    const originalDay = client.installation_date 
      ? Number(client.installation_date.split('-')[2]) 
      : Number(currentDueDate.split('-')[2])

    const [year, month] = currentDueDate.split('-').map(Number)
    let newMonth = month + 1
    let newYear = year
    
    if (newMonth > 12) {
      newMonth = 1
      newYear = year + 1
    }

    const daysInNewMonth = new Date(newYear, newMonth, 0).getDate()
    const finalDay = Math.min(originalDay, daysInNewMonth)
    const newDueDateStr = `${newYear}-${String(newMonth).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}`

    if (!confirm(`Mark as paid?\nDue date will advance from ${currentDueDate} to ${newDueDateStr}`)) return
    
    setProcessingId(client.id)
    
    const { error } = await supabase.from('clients').update({ due_date: newDueDateStr }).eq('id', client.id)

    if (!error) {
      setToast({ message: 'Payment marked successfully!', type: 'success' })
      fetchData()
    } else {
      setToast({ message: 'Error: ' + error.message, type: 'error' })
    }
    setProcessingId(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Live Connection Indicator */}
      <div className="flex items-center justify-between mb-10">
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Due Dates Dashboard
          </h2>
          <p className="text-slate-400 mt-2 text-lg">Manage client payments and schedules</p>
        </div>
        <button 
          onClick={fetchData} 
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-lg border border-slate-700"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl backdrop-blur-sm hover:border-green-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-green-400 font-semibold">Paid</p>
            <CheckCircle size={24} className="text-green-400" />
          </div>
          <p className="text-4xl font-bold text-white">{stats.paid}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-red-500/10 to-pink-500/5 border border-red-500/20 rounded-2xl backdrop-blur-sm hover:border-red-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-red-400 font-semibold">Unpaid</p>
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <p className="text-4xl font-bold text-white">{stats.unpaid}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-2xl backdrop-blur-sm hover:border-orange-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-orange-400 font-semibold">Unsettled</p>
            <Clock size={24} className="text-orange-400" />
          </div>
          <p className="text-4xl font-bold text-white">{stats.unsettled}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 mb-8 flex flex-wrap gap-4 transition-all duration-300 hover:border-slate-600 backdrop-blur-sm">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl pl-12 pr-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" 
          />
        </div>

        <select 
          className="bg-slate-900/50 border border-slate-600 rounded-xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 min-w-[200px]" 
          value={locFilter} 
          onChange={e => setLocFilter(e.target.value)}
        >
          <option value="All">All Locations</option>
          {uniqueLocations.map((loc: any) => <option key={loc} value={loc}>{loc}</option>)}
        </select>

                <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => setStatusFilter('unpaid')} 
            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${statusFilter === 'unpaid' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700 hover:border-slate-600'}`}
          >
            Unpaid
          </button>
          <button 
            onClick={() => setStatusFilter('unsettled')} 
            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${statusFilter === 'unsettled' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700 hover:border-slate-600'}`}
          >
            Unsettled
          </button>
          <button 
            onClick={() => setStatusFilter('paid')} 
            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${statusFilter === 'paid' ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700 hover:border-slate-600'}`}
          >
            Paid
          </button>
        </div>
      </div>

      {/* Info Bar */}
      <div className="mb-6 text-slate-400 text-sm flex items-center gap-2">
        <Activity size={18} />
        Showing <span className="text-white font-bold">{currentData.length}</span> of <span className="text-white font-bold">{totalItems}</span> clients
      </div>

      {/* Clients Table - Mobile Optimized with Horizontal Scroll */}
      <div className="overflow-x-auto bg-slate-900/50 rounded-2xl border border-slate-800 transition-all duration-300 backdrop-blur-sm">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client Name</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Date</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Status</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-8 py-16 text-center">
                  <div className="flex flex-col items-center gap-6">
                    <Activity size={64} className="text-slate-600" />
                    <h3 className="text-2xl font-bold text-slate-300">No Clients Found</h3>
                    <p className="text-slate-500 max-w-md">
                      {searchQuery || locFilter !== 'All' || statusFilter !== 'unpaid' ? 'Try adjusting your search or filters' : 'No due dates matching your criteria'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              currentData.map((client: any, index: number) => {
                const paymentStatus = getPaymentStatus(client)
                const clientStatus = (client.status === 'active' || client.status === 'inactive') ? client.status : 'active'
                const isProcessing = processingId === client.id
                const dueDate = getDueDate(client)
                const daysLeft = getDaysRemaining(dueDate)
                
                // Button should only be enabled when payment status is Unpaid or Unsettled
                const isMarkAsPaidEnabled = paymentStatus.text === 'Unpaid' || paymentStatus.text === 'Unsettled'
                
                return (
                  <tr 
                    key={client.id} 
                    className="group/row hover:bg-slate-800/50 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                          {client.client_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white group-hover/name:text-blue-300 transition-colors">
                          {client.client_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 group-hover/status:scale-110 ${
                        clientStatus === 'active' 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                      }`}>
                        {clientStatus === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-8 py-5 group-hover/location:text-blue-300 transition-colors">
                      <div className="flex items-center gap-2">
                        {client.location || '-'}
                      </div>
                    </td>
                    <td className="px-8 py-5 group-hover/plan:text-green-300 transition-colors">
                      <div className="flex items-center gap-2">
                        {client.plans?.name} <span className="text-slate-500">|</span> ₱{client.plans?.price}
                      </div>
                    </td>
                    <td className="px-8 py-5 group-hover/date:text-yellow-300 transition-colors">
                      <div className="flex items-center gap-2 flex-wrap">
                        {dueDate}
                        {daysLeft !== null && (
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            daysLeft < 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                            daysLeft === 0 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 
                            'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 group-hover/status:scale-110 ${paymentStatus.color}`}>
                        {paymentStatus.text}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {isAdmin && (
                        <div className="flex justify-end">
                          <button 
                            onClick={() => handleMarkAsPaid(client)} 
                            disabled={isProcessing || !isMarkAsPaidEnabled} 
                            className={`p-2.5 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isMarkAsPaidEnabled ? 'group-hover/actions:bg-teal-500/20' : ''
                            }`}
                            title="Mark as Paid"
                          >
                            {isProcessing ? (
                              <Loader2 size={20} className="animate-spin" />
                            ) : (
                              <CheckCircle size={20} />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 bg-slate-800/50 p-5 rounded-2xl border border-slate-700 transition-all duration-300 hover:border-slate-600 backdrop-blur-sm">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-all duration-300 hover:scale-105"
          >
            <ChevronLeft size={20} /> Previous
          </button>
          <span className="text-slate-300">
            Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
          </span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-all duration-300 hover:scale-105"
          >
            Next <ChevronRight size={20} />
          </button>
        </div>
      )}

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