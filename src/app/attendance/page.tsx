'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  CheckCircle, X, AlertCircle, RefreshCw, Loader2,
  Users, UserCheck, UserX, ChevronLeft, ChevronRight, Calendar
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

const toDateStr = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const getTodayStr = () => {
  const d = new Date()
  return toDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function AttendanceCalendarModal({ emp, attendance, isAdmin, onClose, onToggle, processingId }: {
  emp: any, attendance: any[], isAdmin: boolean,
  onClose: () => void, onToggle: (dateStr: string) => void, processingId: string | null
}) {
  const today = getTodayStr()
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1)

  const daysInMonth = new Date(calYear, calMonth, 0).getDate()
  const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay()

  const empAttendance = useMemo(() =>
    new Set(attendance.filter(a => a.employee_id === emp.id && a.status === 'present').map(a => a.date))
  , [attendance, emp.id])

  const totalDaysWorked = empAttendance.size

  // Present days in current calendar month view
  const presentThisMonth = useMemo(() => {
    const prefix = `${calYear}-${String(calMonth).padStart(2, '0')}`
    return [...empAttendance].filter(d => d.startsWith(prefix)).length
  }, [empAttendance, calYear, calMonth])

  const prevMonth = () => {
    if (calMonth === 1) { setCalMonth(12); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 12) { setCalMonth(1); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-3xl w-full max-w-md border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold">
              {emp.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-white">{emp.name}</p>
              <p className="text-xs text-slate-400">{emp.position}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-all hover:rotate-90 duration-300">
            <X size={24} />
          </button>
        </div>

        {/* Calendar */}
        <div className="p-6">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-white">
              <ChevronLeft size={18} />
            </button>
            <h3 className="font-bold text-white">{MONTHS[calMonth - 1]} {calYear}
              <span className="ml-2 text-xs text-green-400 font-normal">({presentThisMonth} present)</span>
            </h3>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-white">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">{d}</div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = toDateStr(calYear, calMonth, day)
              const isPresent = empAttendance.has(dateStr)
              const isToday = dateStr === today
              const processing = processingId === dateStr

              return (
                <button
                  key={day}
                  onClick={() => isAdmin && onToggle(dateStr)}
                  disabled={processing || !isAdmin}
                  className={`relative aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                    ${isPresent
                      ? 'bg-green-500 text-white hover:bg-green-400'
                      : isToday
                      ? 'ring-2 ring-cyan-500 text-cyan-400 hover:bg-slate-700'
                      : 'text-slate-300 hover:bg-slate-700/60'}
                    ${!isAdmin ? 'cursor-default' : 'cursor-pointer'}
                    disabled:opacity-60`}
                >
                  {processing ? <Loader2 size={12} className="animate-spin" /> : day}
                </button>
              )
            })}
          </div>

          {isAdmin && (
            <p className="text-xs text-slate-500 mt-3 text-center">Click a date to toggle present / absent</p>
          )}
        </div>

        {/* Footer — total days worked */}
        <div className="border-t border-slate-700 px-6 py-4 flex items-center justify-between bg-slate-900/50 rounded-b-3xl">
          <span className="text-slate-400 text-sm">Total Days Worked</span>
          <span className="text-2xl font-bold text-green-400">{totalDaysWorked} <span className="text-sm font-normal text-slate-400">days</span></span>
        </div>
      </div>
    </div>
  )
}

export default function AttendancePage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState<any>(null)
  const [search, setSearch] = useState('')
  const today = getTodayStr()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setIsAdmin(['ronnelpaciano.1986@gmail.com'].includes(data.user.email.toLowerCase()))
    })
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

  const handleToggleDate = async (dateStr: string) => {
    if (!selectedEmp) return
    const existing = attendance.find(a => a.employee_id === selectedEmp.id && a.date === dateStr)
    setProcessingId(dateStr)
    if (existing) {
      const { error } = await supabase.from('attendance').delete().eq('id', existing.id)
      if (error) setToast({ message: 'Error: ' + error.message, type: 'error' })
    } else {
      const { error } = await supabase.from('attendance').insert({ employee_id: selectedEmp.id, date: dateStr, status: 'present' })
      if (error) setToast({ message: 'Error: ' + error.message, type: 'error' })
    }
    setProcessingId(null)
  }

  const todayPresent = attendance.filter(a => a.date === today && a.status === 'present').length
  const todayAbsent = employees.length - todayPresent

  const totalDaysWorked = (empId: string) =>
    attendance.filter(a => a.employee_id === empId && a.status === 'present').length

  const isPresentToday = (empId: string) =>
    attendance.some(a => a.employee_id === empId && a.date === today && a.status === 'present')

  const filtered = useMemo(() =>
    employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.position?.toLowerCase().includes(search.toLowerCase()))
  , [employees, search])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Attendance</h2>
          <p className="text-slate-400 mt-2 text-lg">Today: {today}</p>
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
          <p className="text-4xl font-bold text-white">{todayPresent}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-red-500/10 to-pink-500/5 border border-red-500/20 rounded-2xl">
          <div className="flex items-center justify-between mb-3"><p className="text-red-400 font-semibold">Absent Today</p><UserX size={24} className="text-red-400" /></div>
          <p className="text-4xl font-bold text-white">{todayAbsent}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 mb-6">
        <input type="text" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
      </div>

      {/* Employee List */}
      <div className="overflow-x-auto bg-slate-900/50 rounded-2xl border border-slate-800">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              {['Employee', 'Position', 'Today', 'Total Days Worked', 'Attendance'].map(h => (
                <th key={h} className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="px-6 py-4"><div className="h-5 bg-slate-700/50 rounded w-24"></div></td>
                ))}
              </tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500">No employees found.</td></tr>
            ) : filtered.map((emp: any) => {
              const presentToday = isPresentToday(emp.id)
              const totalWorked = totalDaysWorked(emp.id)
              return (
                <tr key={emp.id} className="hover:bg-slate-800/50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{emp.position}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${presentToday ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {presentToday ? 'Present' : 'Absent'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {totalWorked} days
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setSelectedEmp(emp)}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border border-cyan-500/20 rounded-xl text-sm font-semibold transition-all hover:scale-105">
                      <Calendar size={15} /> View Calendar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Calendar Modal */}
      {selectedEmp && (
        <AttendanceCalendarModal
          emp={selectedEmp}
          attendance={attendance}
          isAdmin={isAdmin}
          onClose={() => setSelectedEmp(null)}
          onToggle={handleToggleDate}
          processingId={processingId}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
