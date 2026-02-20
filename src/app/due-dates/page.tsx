'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function DueDatesPage() {
  const [clients, setClients] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [locFilter, setLocFilter] = useState('All')

  useEffect(() => { 
    fetchData() 
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('clients').select('*, plans(name, price)').order('client_name')
    setClients(data || [])
  }

  const today = new Date()

  const getStatus = (client: any) => {
    if (!client.due_date) return 'paid'
    const dueDate = new Date(client.due_date)
    if (dueDate <= today) {
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysOverdue > 30) return 'unsettled'
      return 'unpaid'
    }
    return 'paid'
  }

  // Get unique locations for dropdown
  const uniqueLocations = [...new Set(clients.map(c => c.location).filter(Boolean))]

  const filteredClients = clients
    .filter((c: any) => c.due_date) // Only show clients with due dates
    .filter((c: any) => {
      // Status filter
      const status = getStatus(c)
      if (statusFilter === 'all') return true
      return status === statusFilter
    })
    .filter((c: any) => {
      // Location filter
      if (locFilter === 'All') return true
      return c.location === locFilter
    })
    .sort((a, b) => a.client_name.localeCompare(b.client_name))

  const stats = {
    paid: clients.filter(c => getStatus(c) === 'paid').length,
    unpaid: clients.filter(c => getStatus(c) === 'unpaid').length,
    unsettled: clients.filter(c => getStatus(c) === 'unsettled').length,
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Due Dates List (A-Z)</h2>

      {/* Stats */}
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
          <p className="text-orange-400 font-bold">Unsettled (30+ days)</p>
          <p className="text-2xl font-bold">{stats.unsettled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Location Filter */}
        <select 
          className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
          value={locFilter}
          onChange={e => setLocFilter(e.target.value)}
        >
          <option value="All">All Locations</option>
          {uniqueLocations.map((loc: any) => <option key={loc} value={loc}>{loc}</option>)}
        </select>

        {/* Status Filter Buttons */}
        <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg ${statusFilter === 'all' ? 'bg-cyan-600' : 'bg-slate-700'}`}>All</button>
        <button onClick={() => setStatusFilter('paid')} className={`px-4 py-2 rounded-lg ${statusFilter === 'paid' ? 'bg-green-600' : 'bg-slate-700'}`}>Paid</button>
        <button onClick={() => setStatusFilter('unpaid')} className={`px-4 py-2 rounded-lg ${statusFilter === 'unpaid' ? 'bg-red-600' : 'bg-slate-700'}`}>Unpaid</button>
        <button onClick={() => setStatusFilter('unsettled')} className={`px-4 py-2 rounded-lg ${statusFilter === 'unsettled' ? 'bg-orange-600' : 'bg-slate-700'}`}>Unsettled</button>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Client Name</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredClients.map((client: any) => {
              const status = getStatus(client)
              return (
                <tr key={client.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 font-medium">{client.client_name}</td>
                  <td className="px-6 py-4">{client.location}</td>
                  <td className="px-6 py-4">{client.plans?.name} (₱{client.plans?.price})</td>
                  <td className="px-6 py-4">{client.due_date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      status === 'paid' ? 'bg-green-500/10 text-green-500' : 
                      status === 'unpaid' ? 'bg-red-500/10 text-red-500' : 
                      'bg-orange-500/10 text-orange-500'
                    }`}>
                      {status === 'paid' ? 'Paid' : status === 'unpaid' ? 'Unpaid' : 'Unsettled'}
                    </span>
                  </td>
                </tr>
              )
            })}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No clients found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}