'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

      <h3 className="text-xl font-bold mb-4">All Clients (A-Z)</h3>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {clients.map((client: any) => {
              const isUnpaid = client.due_date && client.due_date <= today
              return (
                <tr key={client.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 font-medium">{client.client_name}</td>
                  <td className="px-6 py-4">{client.location}</td>
                  <td className="px-6 py-4">{client.plans?.name}</td>
                  <td className="px-6 py-4">{client.due_date || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${isUnpaid ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                      {isUnpaid ? 'Unpaid' : 'Active'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}