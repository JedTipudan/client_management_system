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
  Activity,
  Pen,
  Info
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

// --- Custom Tooltip Component ---
const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => {
  if (!text) return <>{children}</>
  
  return (
    <div className="group relative inline-block">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100 z-50 w-max max-w-[200px]">
        <div className="relative rounded-lg bg-slate-800 border border-slate-700 p-3 shadow-xl">
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800 border-l border-t border-slate-700"></div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  )
}

// --- Note Modal Component ---
const NoteModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialNote 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (note: string) => void, 
  initialNote: string 
}) => {
  const [note, setNote] = useState(initialNote)

  useEffect(() => {
    setNote(initialNote)
  }, [initialNote, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">Edit Client Note</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <label className="block text-sm font-medium text-slate-400 mb-2">Internal Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add details about this client..."
            className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm"
          />
        </div>
        <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(note)}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Skeleton Loader Component ---
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 bg-slate-700/50 rounded w-32"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-slate-700/50 rounded w-16"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-slate-700/50 rounded w-24"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-slate-700/50 rounded w-20"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-slate-700/50 rounded w-24"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-slate-700/50 rounded w-20"></div></td>
    <td className="px-6 py-4"><div className="h-8 bg-slate-700/50 rounded w-24 ml-auto"></div></td>
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

  // --- Note Modal State ---
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteText, setEditingNoteText] = useState('')

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
    // IMPORTANT: Ensure 'notes' column exists in your Supabase clients table
    const { data } = await supabase.from('clients').select('*, plans(name, price), notes').order('client_name')
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

  const getPaymentStatus = (client: any) => {
    const dueDate = getDueDate(client)
    if (!dueDate) return { text: 'Pending', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
    
    const todayStr = getTodayStr()
    const today = new Date(todayStr + 'T00:00:00')
    const dueDateObj = new Date(dueDate + 'T00:00:00')
    
    const todayYearMonth = getCurrentYearMonth()
    const [dueYear, dueMonth] = dueDate.split('-').map(Number)
    const monthsOverdue = (todayYearMonth.year - dueYear) * 12 + (todayYearMonth.month - dueMonth)
    
    if (dueDateObj > today) return { text: 'Paid', color: 'bg-green-500/10 text-green-400 border-green-500/20' }
    if (monthsOverdue >= 1) return { text: 'Unsettled', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' }
    return { text: 'Unpaid', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
  }

  const isDueDateInCurrentMonth = (dateStr: string) => {
    const today = getCurrentYearMonth()
    const [dueYear, dueMonth, dueDay] = dateStr.split('-').map(Number)
    return today.year === dueYear && today.month === dueMonth && dueDay <= getTodayDay()
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
      if (statusFilter === 'unpaid') return status.text === 'Unpaid' && isDueDateInCurrentMonth(dueDate)
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

  // --- Handlers ---
  const handleMarkAsPaid = async (client: any) => {
    const currentDueDate = getDueDate(client)
    if (!currentDueDate) return

    const [year, month, day] = currentDueDate.split('-').map(Number)
    let newMonth = month + 1
    let newYear = year
    
    if (newMonth > 12) {
      newMonth = 1
      newYear = year + 1
    }

    const daysInNewMonth = new Date(newYear, newMonth + 1, 0).getDate()
    const finalDay = Math.min(day, daysInNewMonth)
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

    const openNoteModal = (client: any) => {
    setEditingNoteId(client.id)
    setEditingNoteText(client.notes || '')
    setIsNoteModalOpen(true)
  }

  const saveNote = async (note: string) => {
    setProcessingId(editingNoteId)
    const { error } = await supabase
      .from('clients')
      .update({ notes: note })
      .eq('id', editingNoteId)

    if (!error) {
      setToast({ message: 'Note saved successfully!', type: 'success' })
      fetchData()
    } else {
      setToast({ message: 'Error saving note', type: 'error' })
    }
    setIsNoteModalOpen(false)
    setProcessingId(null)
  }

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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Due Dates Dashboard
          </h2>
          <p className="text-slate-400 mt-1">Manage client payments and schedules</p>
        </div>
        <button 
          onClick={fetchData} 
          className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-white border border-slate-700 transition-all hover:scale-105"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> 
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-400 font-semibold">Paid</p>
            <CheckCircle size={20} className="text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.paid}</p>
        </div>
        <div className="p-5 bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-red-400 font-semibold">Unpaid</p>
            <AlertCircle size={20} className="text-red-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.unpaid}</p>
        </div>
        <div className="p-5 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-orange-400 font-semibold">Unsettled</p>
            <Clock size={20} className="text-orange-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.unsettled}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        <select 
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          value={locFilter} 
          onChange={e => setLocFilter(e.target.value)}
        >
          <option value="All">All Locations</option>
          {uniqueLocations.map((loc: any) => <option key={loc} value={loc}>{loc}</option>)}
        </select>

        <div className="flex gap-2">
          <button 
            onClick={() => setStatusFilter('unpaid')} 
            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${statusFilter === 'unpaid' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            Unpaid
          </button>
          <button 
            onClick={() => setStatusFilter('unsettled')} 
            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${statusFilter === 'unsettled' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            Unsettled
          </button>
          <button 
            onClick={() => setStatusFilter('paid')} 
            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${statusFilter === 'paid' ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            Paid
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-900 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <Activity size={32} className="text-slate-600" />
                    <p>No clients found matching your criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentData.map((client: any) => {
                const paymentStatus = getPaymentStatus(client)
                const clientStatus = (client.status === 'active' || client.status === 'inactive') ? client.status : 'active'
                const isProcessing = processingId === client.id
                const dueDate = getDueDate(client)
                const daysLeft = getDaysRemaining(dueDate)
                
                // Button should only be enabled when payment status is Unpaid or Unsettled
                const isMarkAsPaidEnabled = paymentStatus.text === 'Unpaid' || paymentStatus.text === 'Unsettled'
                
                return (
                  <tr key={client.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-white">
                      <Tooltip text={client.notes || 'No notes added'}>
                        <span className="cursor-help border-b border-dashed border-slate-600 hover:border-slate-400 transition-colors">
                          {client.client_name}
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${clientStatus === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {clientStatus === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{client.location || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-300">
                      {client.plans?.name} <span className="text-slate-500">|</span> ₱{client.plans?.price}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="flex items-center gap-2">
                        {dueDate}
                        {daysLeft !== null && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            daysLeft < 0 ? 'bg-red-500/10 text-red-400' : 
                            daysLeft === 0 ? 'bg-orange-500/10 text-orange-400' : 
                            'bg-green-500/10 text-green-400'
                          }`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${paymentStatus.color}`}>
                        {paymentStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openNoteModal(client)} 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
                            title="Edit Note"
                          >
                            <Pen className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleMarkAsPaid(client)} 
                            disabled={isProcessing || !isMarkAsPaidEnabled} 
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              isMarkAsPaidEnabled 
                                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20 hover:scale-105' 
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                            {isProcessing ? 'Processing...' : 'Mark Paid'}
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
        <div className="flex items-center justify-between mt-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            className="flex items-center gap-1 px-4 py-2 bg-slate-800 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft size={18} /> Previous
          </button>
          <span className="text-slate-400 text-sm">
            Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
          </span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            className="flex items-center gap-1 px-4 py-2 bg-slate-800 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            <ChevronRight size={18} /> Next
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

      {/* Note Modal */}
      <NoteModal 
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={saveNote}
        initialNote={editingNoteText}
      />
    </div>
  )
}