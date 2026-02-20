'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Plus, Search, Edit, Trash2, X } from 'lucide-react'
import DatePicker from '../../components/DatePicker'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  
  const [locFilter, setLocFilter] = useState('All')
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    client_name: '', contact_number: '', location: '', plan_id: '', due_date: '', notes: ''
  })
  const [editId, setEditId] = useState<any>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [clientsRes, planRes] = await Promise.all([
      supabase.from('clients').select('*, plans(name, price)'),
      supabase.from('plans').select('*')
    ])
    setClients(clientsRes.data || [])
    setPlans(planRes.data || [])
  }

  const getAutoStatus = (client: any) => {
  if (!client.due_date) return { text: 'Active', color: 'bg-green-500/10 text-green-500' }
  
  const today = new Date()
  const dueDate = new Date(client.due_date)
  
  if (dueDate <= today) {
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysOverdue > 30) {
      return { text: 'Unsettled', color: 'bg-orange-500/10 text-orange-500' }
    }
    return { text: 'Unpaid', color: 'bg-red-500/10 text-red-500' }
  }
  
  return { text: 'Active', color: 'bg-green-500/10 text-green-500' }
}

  const filteredClients = clients
    .filter(c => locFilter === 'All' || c.location === locFilter)
    .filter(c => c.client_name.toLowerCase().includes(search.toLowerCase()) || c.contact_number?.includes(search))
    .sort((a, b) => a.client_name.localeCompare(b.client_name))

  const uniqueLocations = [...new Set(clients.map(c => c.location).filter(Boolean))]

  const handleSave = async () => {
    if (!formData.client_name || !formData.location || !formData.plan_id) {
      alert("Please fill in required fields")
      return
    }
    if (editId) {
      await supabase.from('clients').update(formData).eq('id', editId)
    } else {
      await supabase.from('clients').insert(formData)
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
      due_date: client.due_date, 
      notes: client.notes || '' 
    })
    setEditId(client.id)
    setShowModal(true)
  }

  const handleDateChange = (date: string) => {
    setFormData({...formData, due_date: date})
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold">Clients Management</h2>
        <button onClick={() => { setEditId(null); setFormData({ client_name: '', contact_number: '', location: '', plan_id: '', due_date: '', notes: '' }); setShowModal(true) }} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold">
          <Plus size={20} /> Add Client
        </button>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input type="text" placeholder="Search..." className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white" onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white" onChange={e => setLocFilter(e.target.value)}>
          <option value="All">All Locations</option>
          {uniqueLocations.map((loc: any) => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto bg-slate-800 rounded-xl border border-slate-700">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredClients.map((client: any) => {
              const status = getAutoStatus(client)
              return (
                <tr key={client.id} className="hover:bg-slate-700/50 transition">
                  <td className="px-6 py-4 font-medium">{client.client_name}</td>
                  <td className="px-6 py-4 text-slate-400">{client.contact_number}</td>
                  <td className="px-6 py-4">{client.location}</td>
                  <td className="px-6 py-4">{client.plans?.name} (₱{client.plans?.price})</td>
                  <td className="px-6 py-4">{client.due_date || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${status.color}`}>
                      {status.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(client)} className="text-cyan-400 hover:text-cyan-300 mr-3"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(client.id)} className="text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl w-full max-w-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editId ? 'Edit Client' : 'Add New Client'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Client Name *</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Contact Number</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Location *</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" placeholder="Enter location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Plan *</label>
                <select className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" value={formData.plan_id} onChange={e => setFormData({...formData, plan_id: e.target.value})}>
                  <option value="">Select</option>
                  {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name} - ₱{p.price}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Due Date</label>
                <DatePicker 
                  value={formData.due_date} 
                  onChange={handleDateChange}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <textarea className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700">Cancel</button>
                <button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 px-6 py-2 rounded-lg font-bold">{editId ? 'Update' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}