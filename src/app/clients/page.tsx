'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Activity,
  MapPin,
  Tag,
  Phone
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
    <td className="px-8 py-5"><div className="flex justify-end gap-2"><div className="h-9 w-9 bg-slate-700/50 rounded"></div><div className="h-9 w-9 bg-slate-700/50 rounded"></div></div></td>
  </tr>
)

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
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [lastSync, setLastSync] = useState<Date>(new Date())
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

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

  useEffect(() => {
    const channel = supabase
      .channel('clients_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
        console.log('Client change received!', payload)
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
    const [clientsRes, planRes, locRes] = await Promise.all([
      supabase.from('clients').select('*, plans(name, price)'),
      supabase.from('plans').select('*'),
      supabase.from('locations').select('*').order('name')
    ])
    setClients(clientsRes.data || [])
    setPlans(planRes.data || [])
    setLocations(locRes.data || [])
    setIsLoading(false)
    setLastSync(new Date())
  }

  useEffect(() => { fetchData() }, [])

  // --- Helpers ---
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

  // --- Stats & Filtering ---
  const stats = useMemo(() => ({
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === 'active').length,
    inactiveClients: clients.filter(c => c.status === 'inactive').length,
  }), [clients])

  const filteredClients = useMemo(() => {
    return clients
      .filter(c => locFilter === 'All' || c.location === locFilter)
      .filter(c => c.client_name.toLowerCase().includes(search.toLowerCase()) || c.contact_number?.includes(search))
      .sort((a, b) => new Date(a.installation_date || a.due_date).getTime() - new Date(b.installation_date || b.due_date).getTime())
  }, [clients, locFilter, search])

  const totalItems = filteredClients.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const currentData = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => { setCurrentPage(1) }, [locFilter, search])

  // --- Actions ---
  const handleSave = async () => {
    if (!formData.client_name || !formData.location || !formData.plan_id || !formData.installation_date) {
      setToast({ message: 'Please fill in all required fields', type: 'error' })
      return
    }
    const due_date = calculateDueDate(formData.installation_date)
    const finalData = { ...formData, due_date }
    setProcessingId('saving')
    
    if (editId) {
      const { error } = await supabase.from('clients').update(finalData).eq('id', editId)
      if (!error) {
        setToast({ message: 'Client updated successfully!', type: 'success' })
      } else {
        setToast({ message: 'Error: ' + error.message, type: 'error' })
      }
    } else {
      const { error } = await supabase.from('clients').insert(finalData)
      if (!error) {
        setToast({ message: 'Client added successfully!', type: 'success' })
      } else {
        setToast({ message: 'Error: ' + error.message, type: 'error' })
      }
    }
    
    setShowModal(false)
    setFormData({ client_name: '', contact_number: '', location: '', plan_id: '', installation_date: '', status: 'active' })
    setEditId(null)
    setProcessingId(null)
    fetchData()
  }

  const handleDelete = async (id: any) => {
    if (confirm('Delete this client? This action cannot be undone.')) {
      setProcessingId(id)
      const { error } = await supabase.from('clients').delete().eq('id', id)
      
      if (!error) {
        setToast({ message: 'Client deleted successfully!', type: 'success' })
        fetchData()
      } else {
        setToast({ message: 'Error: ' + error.message, type: 'error' })
      }
      
      setProcessingId(null)
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

  // --- Render ---
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
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Clients Management
          </h2>
          <p className="text-slate-400 mt-2 text-lg">Manage your client database</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData} 
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-lg border border-slate-700"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
          {isAdmin && (
            <button 
              onClick={() => { setEditId(null); setFormData({ client_name: '', contact_number: '', location: '', plan_id: '', installation_date: '', status: 'active' }); setShowModal(true) }} 
              className="group flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-2.5 rounded-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> Add Client
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-2xl backdrop-blur-sm hover:border-cyan-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-cyan-400 font-semibold">Total Clients</p>
            <Users size={24} className="text-cyan-400" />
          </div>
          <p className="text-4xl font-bold text-white">{stats.totalClients}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl backdrop-blur-sm hover:border-green-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-green-400 font-semibold">Active</p>
            <CheckCircle size={24} className="text-green-400" />
          </div>
          <p className="text-4xl font-bold text-white">{stats.activeClients}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-red-500/10 to-pink-500/5 border border-red-500/20 rounded-2xl backdrop-blur-sm hover:border-red-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-red-400 font-semibold">Inactive</p>
            <X size={24} className="text-red-400" />
          </div>
          <p className="text-4xl font-bold text-white">{stats.inactiveClients}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 mb-8 flex flex-wrap gap-4 transition-all duration-300 hover:border-slate-600 backdrop-blur-sm">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search clients..." 
            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl pl-12 pr-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <select 
          className="bg-slate-900/50 border border-slate-600 rounded-xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" 
          onChange={e => setLocFilter(e.target.value)}
        >
          <option value="All">All Locations</option>
          {locations.map((loc: any) => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
        </select>
      </div>

      {/* Info Bar */}
      <div className="mb-6 text-slate-400 text-sm flex items-center gap-2">
        <Activity size={18} />
        Showing <span className="text-white font-bold">{currentData.length}</span> of <span className="text-white font-bold">{totalItems}</span> clients
      </div>

      {/* Clients Table */}
      <div className="overflow-x-auto bg-slate-900/50 rounded-2xl border border-slate-800 transition-all duration-300 backdrop-blur-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Installation Date</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
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
                      {search || locFilter !== 'All' ? 'Try adjusting your search or filters' : 'Add a client to get started'}
                    </p>
                    {isAdmin && (
                      <button 
                        onClick={() => { setEditId(null); setFormData({ client_name: '', contact_number: '', location: '', plan_id: '', installation_date: '', status: 'active' }); setShowModal(true) }} 
                        className="group flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-3 rounded-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30"
                      >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> Add Client
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              currentData.map((client: any, index: number) => {
                const clientStatus = (client.status === 'active' || client.status === 'inactive') ? client.status : 'active'
                return (
                  <tr 
                    key={client.id} 
                    className="group/row hover:bg-slate-800/50 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
                          {client.client_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white group-hover/name:text-cyan-300 transition-colors">
                          {client.client_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-400 group-hover/contact:text-white transition-colors">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-slate-500" />
                        {client.contact_number || '-'}
                      </div>
                    </td>
                    <td className="px-8 py-5 group-hover/location:text-cyan-300 transition-colors">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-slate-500" />
                        {client.location || '-'}
                      </div>
                    </td>
                    <td className="px-8 py-5 group-hover/plan:text-green-300 transition-colors">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-slate-500" />
                        {client.plans?.name} <span className="text-slate-500">|</span> ₱{client.plans?.price}
                      </div>
                    </td>
                    <td className="px-8 py-5 group-hover/date:text-yellow-300 transition-colors">
                      {client.installation_date || '-'}
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
                    <td className="px-8 py-5 text-right">
                      {isAdmin && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEdit(client)} 
                            className="p-2.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all duration-300 hover:scale-110"
                            title="Edit Client"
                          >
                            <Edit size={20} />
                                                    </button>
                          <button 
                            onClick={() => handleDelete(client.id)} 
                            disabled={processingId === client.id}
                            className="p-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Client"
                          >
                            {processingId === client.id ? (
                              <Loader2 size={20} className="animate-spin" />
                            ) : (
                              <Trash2 size={20} />
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

      {/* Add/Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="bg-slate-800 p-8 rounded-3xl w-full max-w-2xl border border-slate-700 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-white">
                {editId ? 'Edit Client' : 'Add New Client'}
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-white hover:rotate-90 transition-all duration-300"
              >
                <X size={28} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Client Name *</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" 
                  placeholder="e.g., Juan Dela Cruz"
                  value={formData.client_name}
                  onChange={e => setFormData({...formData, client_name: e.target.value})}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Contact Number</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" 
                  placeholder="e.g., 09123456789"
                  value={formData.contact_number}
                  onChange={e => setFormData({...formData, contact_number: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Location *</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                >
                  <option value="">Select Location</option>
                  {locations.map((loc: any) => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Plan *</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" 
                  value={formData.plan_id}
                  onChange={e => setFormData({...formData, plan_id: e.target.value})}
                >
                  <option value="">Select Plan</option>
                  {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name} - ₱{p.price}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Installation Date *</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" 
                  value={formData.installation_date}
                  onChange={e => setFormData({...formData, installation_date: e.target.value})}
                />
                <p className="text-xs text-slate-500 mt-1">Due date will be auto-calculated: Installation + 1 month</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Status *</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300" 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700 transition-all duration-300 hover:scale-105"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={processingId === 'saving'}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-2.5 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 flex items-center gap-2"
                >
                  {processingId === 'saving' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editId ? 'Update Client' : 'Add Client'
                  )}
                </button>
              </div>
            </div>
          </div>
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
                         