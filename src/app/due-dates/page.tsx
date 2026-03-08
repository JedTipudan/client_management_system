'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { CheckCircle, Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

export default function DueDatesPage() {
  const [clients, setClients] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [locFilter, setLocFilter] = useState('All')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const getCurrentYearMonth = () => {
    const today = new Date()
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1
    }
  }

  const getTodayDay = () => {
    const today = new Date()
    return today.getDate()
  }

  const getTodayStr = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const userData = data.user
      setUser(userData)
      if (userData?.email) {
        setIsAdmin(['ronnelpaciano.1986@gmail.com'].includes(userData.email.toLowerCase()))
      }
    })
  }, [])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('clients').select('*, plans(name, price)').order('client_name')
    setClients(data || [])
  }

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

  const getPaymentStatus = (client: any): { text: string; color: string } => {
    const dueDate = getDueDate(client)
    if (!dueDate) return { text: 'Unpaid', color: 'bg-red-500/10 text-red-500' }
    
    const todayStr = getTodayStr()
    const today = new Date(todayStr + 'T00:00:00')
    const dueDateObj = new Date(dueDate + 'T00:00:00')
    
    const todayYearMonth = getCurrentYearMonth()
    const [dueYear, dueMonth] = dueDate.split('-').map(Number)
    
    const monthsOverdue = (todayYearMonth.year - dueYear) * 12 + (todayYearMonth.month - dueMonth)
    
    // FIXED LOGIC:
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

  const isDueDateInCurrentMonth = (dateStr: string) => {
    const today = getCurrentYearMonth()
    const [dueYear, dueMonth, dueDay] = dateStr.split('-').map(Number)
    
    // Check if due date is in current month AND day is <= today
    return today.year === dueYear && 
           today.month === dueMonth && 
           dueDay <= getTodayDay()
  }

  const filteredByLocation = clients.filter((c: any) => {
    if (locFilter === 'All') return true
    return c.location === locFilter
  })

  const filteredClients = filteredByLocation
    .filter((c: any) => c.installation_date || c.due_date)
    .filter((c: any) => {
      const status = getPaymentStatus(c)
      const dueDate = getDueDate(c)
      
      if (statusFilter === 'all') return true
      if (statusFilter === 'paid') return status.text === 'Paid'
      if (statusFilter === 'unsettled') return status.text === 'Unsettled'
      
      if (statusFilter === 'unpaid') {
        // Only show unpaid if due date is in current month so far
        return status.text === 'Unpaid' && isDueDateInCurrentMonth(dueDate)
      }
      
      return true
    })
    .sort((a, b) => {
      const dateA = a.installation_date || a.due_date || ''
      const dateB = b.installation_date || b.due_date || ''
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })

  const totalItems = filteredClients.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const currentData = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => { setCurrentPage(1) }, [statusFilter, locFilter])

  const stats = {
    paid: clients.filter(c => getPaymentStatus(c).text === 'Paid').length,
    unpaid: clients.filter(c => getPaymentStatus(c).text === 'Unpaid').length,
    unsettled: clients.filter(c => getPaymentStatus(c).text === 'Unsettled').length,
  }

  const uniqueLocations = [...new Set(clients.map(c => c.location).filter(Boolean))]

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
      fetchData()
    } else {
      alert("Error: " + error.message)
    }
    setProcessingId(null)
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold">Due Dates List</h2>
        <button onClick={fetchData} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-white">
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
          <p className="text-green-400 font-bold">Paid</p>
          <p className="text-2xl font-bold">{stats.paid}</p>
        </div>
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 font-bold">Unpaid</p>
          <p className="text-2xl font-bold">{stats.unpaid}</p>
        </div>
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
          <p className="text-orange-400 font-bold">Unsettled</p>
          <p className="text-2xl font-bold">{stats.unsettled}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <select className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white" value={locFilter} onChange={e => setLocFilter(e.target.value)}>
          <option value="All">All Locations</option>
          {uniqueLocations.map((loc: any) => <option key={loc} value={loc}>{loc}</option>)}
        </select>

        <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg ${statusFilter === 'all' ? 'bg-cyan-600' : 'bg-slate-700'}`}>All</button>
        <button onClick={() => setStatusFilter('paid')} className={`px-4 py-2 rounded-lg ${statusFilter === 'paid' ? 'bg-green-600' : 'bg-slate-700'}`}>Paid</button>
        <button onClick={() => setStatusFilter('unpaid')} className={`px-4 py-2 rounded-lg ${statusFilter === 'unpaid' ? 'bg-red-600' : 'bg-slate-700'}`}>Unpaid</button>
        <button onClick={() => setStatusFilter('unsettled')} className={`px-4 py-2 rounded-lg ${statusFilter === 'unsettled' ? 'bg-orange-600' : 'bg-slate-700'}`}>Unsettled</button>
      </div>

      <div className="overflow-x-auto bg-transparent rounded-xl border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Client Name</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Payment Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {currentData.map((client: any) => {
              const paymentStatus = getPaymentStatus(client)
              const clientStatus = (client.status === 'active' || client.status === 'inactive') ? client.status : 'active'
              const isProcessing = processingId === client.id
              const dueDate = getDueDate(client)
              
              // Button should only be enabled when payment status is Unpaid or Unsettled
              const isMarkAsPaidEnabled = paymentStatus.text === 'Unpaid' || paymentStatus.text === 'Unsettled'
              
              return (
                <tr key={client.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${clientStatus === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {clientStatus === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{client.client_name}</td>
                  <td className="px-6 py-4">{client.location}</td>
                  <td className="px-6 py-4">{client.plans?.name} (₱{client.plans?.price})</td>
                  <td className="px-6 py-4">{dueDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${paymentStatus.color}`}>
                      {paymentStatus.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isAdmin && (
                      <button 
                        onClick={() => handleMarkAsPaid(client)} 
                        disabled={isProcessing || !isMarkAsPaidEnabled} 
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-white text-xs font-bold rounded disabled:opacity-50 ${
                          isMarkAsPaidEnabled 
                            ? 'bg-teal-600 hover:bg-teal-500' 
                            : 'bg-slate-600 cursor-not-allowed'
                        }`}
                      >
                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        {isProcessing ? 'Processing...' : 'Mark Paid'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {currentData.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No clients found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-slate-800 p-4 rounded-xl border border-slate-700">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="flex items-center gap-1 px-4 py-2 bg-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600">
            <ChevronLeft size={18} /> Previous
          </button>
          <span className="text-slate-300">Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span></span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="flex items-center gap-1 px-4 py-2 bg-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600">
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}