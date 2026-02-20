'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard() {
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.from('clients').select('*').order('client_name')
      setClients(data || [])
    }
    fetchStats()
  }, [])

  const today = new Date().toISOString().split('T')[0]
  
  const stats = {
    total: clients.length,
    active: clients.filter(c => !c.due_date || c.due_date > today).length,
    unpaid: clients.filter(c => c.due_date && c.due_date <= today).length,
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 border-l-4 border-blue-500">
          <p className="text-slate-400">Total Clients</p>
          <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
        </div>
        <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 border-l-4 border-green-500">
          <p className="text-slate-400">Active</p>
          <h3 className="text-3xl font-bold mt-2">{stats.active}</h3>
        </div>
        <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 border-l-4 border-red-500">
          <p className="text-slate-400">Unpaid (Due Date Passed)</p>
          <h3 className="text-3xl font-bold mt-2">{stats.unpaid}</h3>
        </div>
      </div>
    </div>
  )
}