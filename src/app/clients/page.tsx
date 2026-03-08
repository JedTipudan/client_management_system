'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Plus, Search, Edit, Trash2, X, ChevronLeft, ChevronRight, RefreshCw, Users } from 'lucide-react'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [locFilter, setLocFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ 
    client_name: '', 
    contact_number: '', 
    location: '', 
    plan_id: '', 
    installation_date: '', 
    status: 'active'
  })
  const [editId, setEditId] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)

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
    setLoading(true)
    const [clientsRes, planRes, locRes] = await Promise.all([
      supabase.from('clients').select('*, plans(name, price)'),
      supabase.from('plans').select('*'),
      supabase.from('locations').select('*').order('name')
    ])
    setClients(clientsRes.data || [])
    setPlans(planRes.data || [])
    setLocations(locRes.data || [])
    setLoading(false)
  }

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

  const filteredClients = clients
    .filter(c => locFilter === 'All' || c.location === locFilter)
    .filter(c => c.client_name.toLowerCase().includes(search.toLowerCase()) || c.contact_number?.includes(search))
    .sort((a, b) => new Date(a.installation_date || a.due_date).getTime() - new Date(b.installation_date || b.due_date).getTime())

  const totalItems = filteredClients.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const currentData = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => { setCurrentPage(1) }, [locFilter, search])

  const handleSave = async () => {
    if (!formData.client_name || !formData.location || !formData.plan_id || !formData.installation_date) {
      alert("Please fill in required fields")
      return
    }
    const due_date = calculateDueDate(formData.installation_date)
    const finalData = { ...formData, due_date }
    if (editId) {
      const { error } = await supabase.from('clients').update(finalData).eq('id', editId)
      if (error) { alert("Error updating client: " + error.message); return }
    } else {
      const { error } = await supabase.from('clients').insert(finalData)
      if (error) { alert("Error adding client: " + error.message); return }
    }
    setShowModal(false)
    fetchData()
  }

  const handleDelete = async (id: any) => {
    if(confirm('Delete this client?')) {
      await supabase.from('clients').delete().eq('id', id)
      fetchData()
    }
  }

  const openEdit = (client: any) => {
    setFormData({ 
      client_name: client.client_name, 
      contact_number: client.contact_number, 
      location: client.location, 
      plan_id: client.plan_id, 
      installation_date: client.installation_date || '', 
      status: (client.status === 'active' || client.status === 'inactive') ? client.status : 'active' 
    })
    setEditId(client.id)
    setShowModal(true)
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold animate-slide-in">Clients Management</h2>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {isAdmin && (
            <button onClick={() => { setEditId(null); setFormData({ client_name: '', contact_number: '', location: '', plan_id: '', installation_date: '', status: 'active' }); setShowModal(true) }} className="group flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30">
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> Add Client
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 flex flex-wrap gap-4 transition-all duration-300 hover:border-slate-600">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input type="text" placeholder="Search..." className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" onChange={e => setLocFilter(e.target.value)}>
          <option value="All">All Locations</option>
          {locations.map((loc: any) => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
        </select>
      </div>

      <div className="mb-4 text-slate-400 text-sm flex items-center gap-2">
        <Users size={16} />
        Showing <span className="text-white font-bold">{currentData.length}</span> of <span className="text-white font-bold">{totalItems}</span> clients
      </div>

      <div className="overflow-x-auto bg-transparent rounded-xl border border-white/10 transition-all duration-300 hover:border-white/20">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Installation Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {currentData.map((client: any, index: number) => {
              const clientStatus = (client.status === 'active' || client.status === 'inactive') ? client.status : 'active'
              return (
                <tr key={client.id} className="group/row hover:bg-slate-700/50 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg" style={{ animationDelay: `${index * 50}ms` }}>
                  <td className="px-6 py-4 font-medium group-hover/name:text-cyan-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {client.client_name.charAt(0)}
                      </div>
                      {client.client_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 group-hover/contact:text-white transition-colors">{client.contact_number}</td>
                  <td className="px-6 py-4 group-hover/location:text-cyan-300 transition-colors">{client.location}</td>
                  <td className="px-6 py-4 group-hover/plan:text-green-300 transition-colors">{client.plans?.name} (₱{client.plans?.price})</td>
                  <td className="px-6 py-4 group-hover/date:text-yellow-300 transition-colors">{client.installation_date || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold transition-all duration-300 group-hover/status:scale-110 ${clientStatus === 'active' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}>
                      {clientStatus === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isAdmin && (
                      <div className="flex justify-end gap-3">
                        <button onClick={() => openEdit(client)} className="text-cyan-400 hover:text-cyan-300 hover:scale-110 transition-all duration-300"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(client.id)} className="text-red-400 hover:text-red-300 hover:scale-110 transition-all duration-300"><Trash2 size={18} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {currentData.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500"><div className="flex flex-col items-center gap-2"><Users size={48} className="text-slate-600" /><p>No clients found.</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-slate-800 p-4 rounded-xl border border-slate-700 transition-all duration-300 hover:border-slate-600">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="flex items-center gap-1 px-4 py-2 bg-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-all duration-300 hover:scale-105"><ChevronLeft size={18} /> Previous</button>
          <span className="text-slate-300">Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span></span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="flex items-center gap-1 px-4 py-2 bg-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-all duration-300 hover:scale-105">Next <ChevronRight size={18} /></button>
        </div>
      )}      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-800 p-6 rounded-xl w-full max-w-lg border border-slate-700 max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editId ? 'Edit Client' : 'Add New Client'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white hover:rotate-90 transition-all duration-300"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm text-slate-400 mb-1">Client Name *</label><input type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Contact Number</label><input type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Location *</label><select className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}><option value="">Select</option>{locations.map((loc: any) => <option key={loc.id} value={loc.name}>{loc.name}</option>)}</select></div>
              <div><label className="block text-sm text-slate-400 mb-1">Plan *</label><select className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" value={formData.plan_id} onChange={e => setFormData({...formData, plan_id: e.target.value})}><option value="">Select</option>{plans.map((p: any) => <option key={p.id} value={p.id}>{p.name} - ₱{p.price}</option>)}</select></div>
              <div><label className="block text-sm text-slate-400 mb-1">Installation Date *</label><input type="date" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" value={formData.installation_date} onChange={e => setFormData({...formData, installation_date: e.target.value})} /><p className="text-xs text-slate-500 mt-1">Due date will be auto: Installation + 1 month</p></div>
              <div><label className="block text-sm text-slate-400 mb-1">Status *</label><select className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-all duration-300 hover:scale-105">Cancel</button>
                <button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 px-6 py-2 rounded-lg font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30">{editId ? 'Update' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}