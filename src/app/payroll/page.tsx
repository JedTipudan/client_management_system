'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  Plus, X, CheckCircle, AlertCircle, Loader2, RefreshCw,
  Wallet, ChevronDown, ChevronUp, Search, Edit, Trash2
} from 'lucide-react'

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-xl ${type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose}><X size={14} /></button>
    </div>
  )
}

const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getCurrentPeriod = () => {
  const d = new Date()
  const day = d.getDate()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  // Period: 1-15 = first half, 16-end = second half
  if (day <= 15) return { label: `${y}-${m} (1st–15th)`, start: `${y}-${m}-01`, end: `${y}-${m}-15` }
  const lastDay = new Date(y, d.getMonth() + 1, 0).getDate()
  return { label: `${y}-${m} (16th–${lastDay}th)`, start: `${y}-${m}-16`, end: `${y}-${m}-${lastDay}` }
}

export default function PayrollPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [cashAdvances, setCashAdvances] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [search, setSearch] = useState('')

  // Cash advance modal
  const [showCAModal, setShowCAModal] = useState(false)
  const [caForm, setCaForm] = useState({ employee_id: '', amount: '', date: getTodayStr(), note: '' })
  const [editCAId, setEditCAId] = useState<string | null>(null)

  // Expanded rows for history
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const period = getCurrentPeriod()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setIsAdmin(['ronnelpaciano.1986@gmail.com'].includes(data.user.email.toLowerCase()))
    })
  }, [])

  const fetchAll = async () => {
    setIsLoading(true)
    const [empRes, caRes, attRes] = await Promise.all([
      supabase.from('employees').select('*').eq('status', 'active').order('name'),
      supabase.from('cash_advances').select('*').order('date', { ascending: false }),
      supabase.from('attendance').select('*')
    ])
    setEmployees(empRes.data || [])
    setCashAdvances(caRes.data || [])
    setAttendance(attRes.data || [])
    setIsLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const openAddCA = () => { setEditCAId(null); setCaForm({ employee_id: '', amount: '', date: getTodayStr(), note: '' }); setShowCAModal(true) }

  const openEditCA = (ca: any) => {
    setEditCAId(ca.id)
    setCaForm({ employee_id: ca.employee_id, amount: String(ca.amount), date: ca.date, note: ca.note || '' })
    setShowCAModal(true)
  }

  const handleSaveCA = async () => {
    if (!caForm.employee_id || !caForm.amount) {
      setToast({ message: 'Please fill in all required fields', type: 'error' }); return
    }
    setProcessingId('ca')
    const payload = { employee_id: caForm.employee_id, amount: Number(caForm.amount), date: caForm.date, note: caForm.note || null }
    const { error } = editCAId
      ? await supabase.from('cash_advances').update(payload).eq('id', editCAId)
      : await supabase.from('cash_advances').insert(payload)
    if (!error) {
      setToast({ message: editCAId ? 'Cash advance updated!' : 'Cash advance recorded!', type: 'success' })
      setShowCAModal(false); setCaForm({ employee_id: '', amount: '', date: getTodayStr(), note: '' }); setEditCAId(null); fetchAll()
    } else {
      setToast({ message: 'Error: ' + error.message, type: 'error' })
    }
    setProcessingId(null)
  }

  const handleDeleteCA = async (id: string) => {
    if (!confirm('Delete this cash advance record?')) return
    setProcessingId(id)
    const { error } = await supabase.from('cash_advances').delete().eq('id', id)
    if (!error) { setToast({ message: 'Cash advance deleted!', type: 'success' }); fetchAll() }
    else setToast({ message: 'Error: ' + error.message, type: 'error' })
    setProcessingId(null)
  }

  // Payroll calculation per employee for current period
  const payrollData = useMemo(() => {
    return employees
      .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
      .map(emp => {
        // Days present in current period
        const daysPresent = attendance.filter(a =>
          a.employee_id === emp.id &&
          a.status === 'present' &&
          a.date >= period.start &&
          a.date <= period.end
        ).length

        // Gross salary for period
        let grossSalary = 0
        if (emp.salary_type === 'daily') {
          grossSalary = emp.salary * daysPresent
        } else {
          // Monthly: divide by 2 for each half-month period
          grossSalary = emp.salary / 2
        }

        // Cash advances in current period
        const periodCA = cashAdvances
          .filter(ca => ca.employee_id === emp.id && ca.date >= period.start && ca.date <= period.end)
          .reduce((sum, ca) => sum + Number(ca.amount), 0)

        // All cash advances (total balance)
        const totalCA = cashAdvances
          .filter(ca => ca.employee_id === emp.id)
          .reduce((sum, ca) => sum + Number(ca.amount), 0)

        const netPay = grossSalary - periodCA
        const history = cashAdvances.filter(ca => ca.employee_id === emp.id)

        return { ...emp, daysPresent, grossSalary, periodCA, totalCA, netPay, history }
      })
  }, [employees, cashAdvances, attendance, period, search])

  const totalNet = payrollData.reduce((s, e) => s + e.netPay, 0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">Payroll & Cash Advance</h2>
          <p className="text-slate-400 mt-2">Current Period: <span className="text-white font-semibold">{period.label}</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAll} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-lg text-white transition-all border border-slate-700">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
          {isAdmin && (
            <button onClick={openAddCA}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 px-6 py-2.5 rounded-lg text-white transition-all">
              <Plus size={20} /> Cash Advance
            </button>
          )}
        </div>
      </div>



      {/* Search */}
      <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 mb-8">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl pl-12 pr-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>

      {/* Payroll Table */}
      <div className="space-y-3">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-800/50 rounded-2xl p-5 border border-slate-700 h-20"></div>
        )) : payrollData.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No active employees found.</div>
        ) : payrollData.map((emp: any) => (
          <div key={emp.id} className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            {/* Main Row */}
            <div className="p-5 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[180px]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white font-bold text-sm">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{emp.name}</p>
                  <p className="text-xs text-slate-400">{emp.position} · {emp.daysPresent} days present</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Gross</p>
                  <p className="text-white font-semibold">₱{emp.grossSalary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">CA Deduction</p>
                  <p className="text-red-400 font-semibold">-₱{emp.periodCA.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Net Pay</p>
                  <p className={`font-bold text-lg ${emp.netPay >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>₱{emp.netPay.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Total CA Balance</p>
                  <p className="text-orange-400 font-semibold">₱{emp.totalCA.toLocaleString()}</p>
                </div>
              </div>

              <button onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                className="ml-auto p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
                {expandedId === emp.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>

            {/* CA History */}
            {expandedId === emp.id && (
              <div className="border-t border-slate-700 p-5">
                <p className="text-sm font-semibold text-slate-400 mb-3">Cash Advance History</p>
                {emp.history.length === 0 ? (
                  <p className="text-slate-500 text-sm">No cash advances recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {emp.history.map((ca: any) => (
                      <div key={ca.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-white text-sm font-medium">₱{Number(ca.amount).toLocaleString()}</p>
                          {ca.note && <p className="text-slate-400 text-xs">{ca.note}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-xs">{ca.date}</span>
                          {isAdmin && (
                            <>
                              <button onClick={() => openEditCA(ca)} className="p-1.5 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all"><Edit size={14} /></button>
                              <button onClick={() => handleDeleteCA(ca.id)} disabled={processingId === ca.id} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50">
                                {processingId === ca.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cash Advance Modal */}
      {showCAModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-800 p-8 rounded-3xl w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-white">{editCAId ? 'Edit Cash Advance' : 'Add Cash Advance'}</h3>
              <button onClick={() => setShowCAModal(false)} className="text-slate-400 hover:text-white"><X size={28} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Employee *</label>
                <select value={caForm.employee_id} onChange={e => setCaForm({ ...caForm, employee_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Amount *</label>
                <input type="number" placeholder="e.g. 500" value={caForm.amount} onChange={e => setCaForm({ ...caForm, amount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Date *</label>
                <input type="date" value={caForm.date} onChange={e => setCaForm({ ...caForm, date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Note (optional)</label>
                <input type="text" placeholder="e.g. Emergency" value={caForm.note} onChange={e => setCaForm({ ...caForm, note: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCAModal(false)} className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700 transition-all">Cancel</button>
                <button onClick={handleSaveCA} disabled={processingId === 'ca'}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 px-6 py-2.5 rounded-xl font-bold text-white disabled:opacity-50 flex items-center gap-2">
                  {processingId === 'ca' ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (editCAId ? 'Update' : 'Add Cash Advance')}
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
