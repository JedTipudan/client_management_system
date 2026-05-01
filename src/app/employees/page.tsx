'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  Plus, Search, Edit, Trash2, X, ChevronLeft, ChevronRight,
  RefreshCw, Users, CheckCircle, AlertCircle, Loader2, Activity
} from 'lucide-react'

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-xl ${type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
      <div className={`p-1 rounded-full ${type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
        {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      </div>
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={14} /></button>
    </div>
  )
}

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[40, 32, 28, 24, 24].map((w, i) => (
      <td key={i} className="px-8 py-5"><div className={`h-5 bg-slate-700/50 rounded w-${w}`}></div></td>
    ))}
    <td className="px-8 py-5"><div className="flex justify-end gap-2"><div className="h-9 w-9 bg-slate-700/50 rounded"></div><div className="h-9 w-9 bg-slate-700/50 rounded"></div></div></td>
  </tr>
)

const emptyForm = { name: '', position: '', salary: '', salary_type: 'daily', status: 'active' }

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [editId, setEditId] = useState<any>(null)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setIsAdmin(['ronnelpaciano.1986@gmail.com'].includes(data.user.email.toLowerCase()))
    })
  }, [])

  useEffect(() => {
    const channel = supabase.channel('employees_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('employees').select('*').order('name')
    setEmployees(data || [])
    setIsLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    inactive: employees.filter(e => e.status === 'inactive').length,
  }), [employees])

  const filtered = useMemo(() =>
    employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.position?.toLowerCase().includes(search.toLowerCase()))
  , [employees, search])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => { setCurrentPage(1) }, [search])

  const handleSave = async () => {
    if (!formData.name || !formData.position || !formData.salary) {
      setToast({ message: 'Please fill in all required fields', type: 'error' }); return
    }
    setProcessingId('saving')
    const payload = { ...formData, salary: Number(formData.salary) }
    const { error } = editId
      ? await supabase.from('employees').update(payload).eq('id', editId)
      : await supabase.from('employees').insert(payload)
    if (!error) {
      setToast({ message: editId ? 'Employee updated!' : 'Employee added!', type: 'success' })
      setShowModal(false); setFormData(emptyForm); setEditId(null); fetchData()
    } else {
      setToast({ message: 'Error: ' + error.message, type: 'error' })
    }
    setProcessingId(null)
  }

  const handleDelete = async (id: any) => {
    if (!confirm('Delete this employee? This cannot be undone.')) return
    setProcessingId(id)
    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (!error) { setToast({ message: 'Employee deleted!', type: 'success' }); fetchData() }
    else setToast({ message: 'Error: ' + error.message, type: 'error' })
    setProcessingId(null)
  }

  const openEdit = (emp: any) => {
    setFormData({ name: emp.name, position: emp.position, salary: String(emp.salary), salary_type: emp.salary_type, status: emp.status })
    setEditId(emp.id); setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Employee Management</h2>
          <p className="text-slate-400 mt-2 text-lg">Manage your employee records</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-lg text-white transition-all border border-slate-700">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
          {isAdmin && (
            <button onClick={() => { setEditId(null); setFormData(emptyForm); setShowModal(true) }}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 px-6 py-2.5 rounded-lg text-white transition-all">
              <Plus size={20} /> Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Total Employees', value: stats.total, color: 'violet', icon: <Users size={24} className="text-violet-400" /> },
          { label: 'Active', value: stats.active, color: 'green', icon: <CheckCircle size={24} className="text-green-400" /> },
          { label: 'Inactive', value: stats.inactive, color: 'red', icon: <X size={24} className="text-red-400" /> },
        ].map(s => (
          <div key={s.label} className={`p-6 bg-gradient-to-br from-${s.color}-500/10 to-${s.color}-500/5 border border-${s.color}-500/20 rounded-2xl`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-${s.color}-400 font-semibold`}>{s.label}</p>
              {s.icon}
            </div>
            <p className="text-4xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 mb-8">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl pl-12 pr-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
      </div>

      <div className="mb-6 text-slate-400 text-sm flex items-center gap-2">
        <Activity size={18} /> Showing <span className="text-white font-bold mx-1">{currentData.length}</span> of <span className="text-white font-bold mx-1">{filtered.length}</span> employees
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-slate-900/50 rounded-2xl border border-slate-800">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              {['Name', 'Position', 'Salary', 'Type', 'Status', 'Actions'].map(h => (
                <th key={h} className={`px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {isLoading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) :
              currentData.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-16 text-center text-slate-500">No employees found</td></tr>
              ) : currentData.map((emp: any) => (
                <tr key={emp.id} className="hover:bg-slate-800/50 transition-all">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-300">{emp.position}</td>
                  <td className="px-8 py-5 text-green-400 font-semibold">₱{Number(emp.salary).toLocaleString()}</td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-300 capitalize">{emp.salary_type}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${emp.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {emp.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {isAdmin && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(emp)} className="p-2.5 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(emp.id)} disabled={processingId === emp.id} className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50">
                          {processingId === emp.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 rounded-lg text-white disabled:opacity-50 hover:bg-slate-600 transition-all">
            <ChevronLeft size={20} /> Previous
          </button>
          <span className="text-slate-300">Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span></span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 rounded-lg text-white disabled:opacity-50 hover:bg-slate-600 transition-all">
            Next <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-800 p-8 rounded-3xl w-full max-w-lg border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-white">{editId ? 'Edit Employee' : 'Add Employee'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-all"><X size={28} /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Full Name *', key: 'name', placeholder: 'e.g. Juan Dela Cruz' },
                { label: 'Position *', key: 'position', placeholder: 'e.g. Technician' },
                { label: 'Salary *', key: 'salary', placeholder: 'e.g. 500', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm text-slate-400 mb-2">{f.label}</label>
                  <input type={f.type || 'text'} placeholder={f.placeholder} value={(formData as any)[f.key]}
                    onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Salary Type *</label>
                <select value={formData.salary_type} onChange={e => setFormData({ ...formData, salary_type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Status *</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={processingId === 'saving'}
                  className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 px-6 py-2.5 rounded-xl font-bold text-white disabled:opacity-50 flex items-center gap-2">
                  {processingId === 'saving' ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (editId ? 'Update' : 'Add Employee')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
