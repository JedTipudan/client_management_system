'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  CheckCircle, X, AlertCircle, RefreshCw, Loader2,
  Calendar, Users, UserCheck, UserX, ChevronLeft, ChevronRight
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

export default function AttendancePage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [monthlyPage, setMonthlyPage] = useState(1)
  const itemsPerPage = 10
  const today = getTodayStr()

  useEffect(() => {
    const channel = supabase.channel('attendance_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, fetchAttendance)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchAll = async () => {
    setIsLoading(true)
    const [empRes, attRes] = await Promise.all([
      supabase.from('employees').select('*').eq('status', 'active').order('name'),
      supabase.from('attendance').select('*')
    ])
    setEmployees(empRes.data || [])
    setAttendance(attRes.data || [])
    setIsLoading(false)
  }

  const fetchAttendance = async () => {
    const { data } = await supabase.from('attendance').select('*')
    setAttendance(data || [])
  }

  useEffect(() => { fetchAll() }, [])

  const todayAttendance = useMemo(() =>
    attendance.filter(a => a.date === today)
  , [attendance, today])

  const isPresentToday = (empId: string) =>
    todayAttendance.some(a => a.employee_id === empId && a.status === 'present')

  const handleMarkPresent = async (emp: any) => {
    if (isPresentToday(emp.id)) return
    setProcessingId(emp.id)
    const { error } = await supabase.from('attendance').insert({ employee_id: emp.id, date: today, status: 'present' })
    if (!error) setToast({ message: `${emp.name} marked present!`, type: 'success' })
    else setToast({ message: 'Error: ' + error.message, type: 'error' })
    setProcessingId(null)
  }

  const handleUnmark = async (emp: any) => {
    const record = todayAttendance.find(a => a.employee_id === emp.id)
    if (!record) return
    setProcessingId(emp.id)
    const { error } = await supabase.from('attendance').delete().eq('id', record.id)
    if (!error) setToast({ message: `${emp.name} unmarked!`, type: 'success' })
    else setToast({ message: 'Error: ' + error.message, type: 'error' })
    setProcessingId(null)
  }

  // Monthly summary
  const monthlySummary = useMemo(() => {
    const monthAtt = attendance.filter(a => a.date.startsWith(selectedMonth))
    return employees.map(emp => {
      const present = monthAtt.filter(a => a.employee_id === emp.id && a.status === 'present').length
      // Count working days in selected month
      const [y, m] = selectedMonth.split('-').map(Number)
      const daysInMonth = new Date(y, m, 0).getDate()
      const absent = daysInMonth - present
      return { ...emp, present, absent: Math.max(0, absent) }
    })
  }, [attendance, employees, selectedMonth])

  const totalPresent = todayAttendance.filter(a => a.status === 'present').length
  const totalAbsent = employees.length - totalPresent

  const totalMonthlyPages = Math.ceil(monthlySummary.length / itemsPerPage)
  const monthlyData = monthlySummary.slice((monthlyPage - 1) * itemsPerPage, monthlyPage * itemsPerPage)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Attendance</h2>
          <p className="text-slate-400 mt-2 text-lg">{today}</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-lg text-white transition-all border border-slate-700">
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-teal-500/5 border border-cyan-500/20 rounded-2xl">
          <div className="flex items-center justify-between mb-3"><p className="text-cyan-400 font-semibold">Total Employees</p><Users size={24} className="text-cyan-400" /></div>
          <p className="text-4xl font-bold text-white">{employees.length}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl">
          <div className="flex items-center justify-between mb-3"><p className="text-green-400 font-semibold">Present Today</p><UserCheck size={24} className="text-green-400" /></div>
          <p className="text-4xl font-bold text-white">{totalPresent}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-red-500/10 to-pink-500/5 border border-red-500/20 rounded-2xl">
          <div className="flex items-center justify-between mb-3"><p className="text-red-400 font-semibold">Absent Today</p><UserX size={24} className="text-red-400" /></div>
          <p className="text-4xl font-bold text-white">{totalAbsent}</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-3 mb-8">
        <button onClick={() => setViewMode('daily')}
          className={`px-5 py-2.5 rounded-xl font-medium transition-all ${viewMode === 'daily' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}>
          Daily
        </button>
        <button onClick={() => setViewMode('monthly')}
          className={`px-5 py-2.5 rounded-xl font-medium transition-all ${viewMode === 'monthly' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}>
          Monthly Summary
        </button>
        {viewMode === 'monthly' && (
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        )}
      </div>

      {/* Daily View */}
      {viewMode === 'daily' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-800/50 rounded-2xl p-5 border border-slate-700 h-24"></div>
          )) : employees.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-slate-500">No active employees found. Add employees first.</div>
          ) : employees.map((emp: any) => {
            const present = isPresentToday(emp.id)
            const processing = processingId === emp.id
            return (
              <div key={emp.id} className={`p-5 rounded-2xl border transition-all ${present ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${present ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{emp.name}</p>
                      <p className="text-xs text-slate-400">{emp.position}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {present ? (
                      <>
                        <span className="flex items-center gap-1 text-xs text-green-400 font-bold"><CheckCircle size={14} /> Present</span>
                        <button onClick={() => handleUnmark(emp)} disabled={processing} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Unmark">
                          {processing ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleMarkPresent(emp)} disabled={processing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50">
                        {processing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Mark Present
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Monthly View */}
      {viewMode === 'monthly' && (
        <>
          <div className="overflow-x-auto bg-slate-900/50 rounded-2xl border border-slate-800">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  {['Employee', 'Position', 'Present', 'Absent'].map(h => (
                    <th key={h} className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {monthlyData.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-800/50 transition-all">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-400">{emp.position}</td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">{emp.present} days</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">{emp.absent} days</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalMonthlyPages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
              <button disabled={monthlyPage === 1} onClick={() => setMonthlyPage(p => p - 1)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 rounded-lg text-white disabled:opacity-50 hover:bg-slate-600">
                <ChevronLeft size={20} /> Previous
              </button>
              <span className="text-slate-300">Page <span className="text-white font-bold">{monthlyPage}</span> of <span className="text-white font-bold">{totalMonthlyPages}</span></span>
              <button disabled={monthlyPage === totalMonthlyPages} onClick={() => setMonthlyPage(p => p + 1)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 rounded-lg text-white disabled:opacity-50 hover:bg-slate-600">
                Next <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
