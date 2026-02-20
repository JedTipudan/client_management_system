'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Users, DollarSign, Calendar, AlertCircle, Plus, Clock } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [clients, setClients] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])

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

  useEffect(() => {
    const fetchData = async () => {
      const { data: clientsData } = await supabase.from('clients').select('*, plans(price)').order('created_at', { ascending: false })
      const { data: plansData } = await supabase.from('plans').select('*')
      setClients(clientsData || [])
      setPlans(plansData || [])
    }
    fetchData()
  }, [])

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const totalClients = clients.length
  const activeClients = clients.filter(c => c.due_date && c.due_date > todayStr).length
  const dueToday = clients.filter(c => c.due_date === todayStr).length
  const overdue = clients.filter(c => c.due_date && c.due_date < todayStr).length

  const recentClients = clients.slice(0, 5)

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const upcomingDue = clients
    .filter(c => c.due_date && c.due_date >= todayStr && c.due_date <= nextWeek.toISOString().split('T')[0])
    .slice(0, 5)

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Dashboard Overview</h2>

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
              <p className="text-green-100 text-sm">Active</p>
              <h3 className="text-4xl font-bold mt-2">{activeClients}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-yellow-100 text-sm">Due Today</p>
              <h3 className="text-4xl font-bold mt-2">{dueToday}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-100 text-sm">Overdue</p>
              <h3 className="text-4xl font-bold mt-2">{overdue}</h3>
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
                  <span className="text-yellow-300 font-medium">{client.due_date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}