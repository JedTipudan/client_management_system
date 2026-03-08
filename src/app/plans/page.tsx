'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { 
  Plus, 
  Trash2, 
  X, 
  Edit, 
  Tag, 
  Search, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  DollarSign,
  Users
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
const SkeletonCard = () => (
  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-3 bg-slate-700/50 rounded-lg w-12 h-12"></div>
      <div className="flex-1">
        <div className="h-4 bg-slate-700/50 rounded w-24 mb-2"></div>
        <div className="h-5 bg-slate-700/50 rounded w-16"></div>
      </div>
    </div>
    <div className="flex justify-end gap-2">
      <div className="h-8 w-8 bg-slate-700/50 rounded"></div>
      <div className="h-8 w-8 bg-slate-700/50 rounded"></div>
    </div>
  </div>
)

// --- Confirmation Modal Component ---
const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  type = 'danger'
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string,
  confirmText?: string,
  type?: 'danger' | 'warning'
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${type === 'danger' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
            <AlertCircle size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-slate-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose() }} 
            className={`px-6 py-2 rounded-lg font-bold text-white ${
              type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
            } transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', price: '' })
  const [editId, setEditId] = useState<any>(null)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [lastSync, setLastSync] = useState<Date>(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, planId: string | null, action: 'delete' | 'cancel' }>({
    isOpen: false,
    planId: null,
    action: 'cancel'
  })

  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

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
      .channel('plans_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, (payload) => {
        console.log('Plan change received!', payload)
        fetchPlans()
        setLastSync(new Date())
        setIsLive(true)
        setTimeout(() => setIsLive(false), 2000)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchPlans = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('plans').select('*').order('name')
    setPlans(data || [])
    setIsLoading(false)
    setLastSync(new Date())
  }

  useEffect(() => { fetchPlans() }, [])

  // --- Actions ---
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price) {
      setToast({ message: 'Please fill in all fields', type: 'error' })
      return
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      setToast({ message: 'Price must be a positive number', type: 'error' })
      return
    }

    setProcessingId('saving')
    
    if (editId) {
      const { error } = await supabase.from('plans').update({ name: formData.name.trim(), price }).eq('id', editId)
      if (!error) {
        setToast({ message: 'Plan updated successfully!', type: 'success' })
      } else {
        setToast({ message: 'Error: ' + error.message, type: 'error' })
      }
    } else {
      const { error } = await supabase.from('plans').insert({ name: formData.name.trim(), price })
      if (!error) {
        setToast({ message: 'Plan created successfully!', type: 'success' })
      } else {
        setToast({ message: 'Error: ' + error.message, type: 'error' })
      }
    }
    
    setShowModal(false)
    setFormData({ name: '', price: '' })
    setEditId(null)
    setProcessingId(null)
    fetchPlans()
  }

  const handleDelete = async (id: string) => {
    setConfirmModal({ isOpen: true, planId: id, action: 'delete' })
  }

  const confirmDelete = async () => {
    if (!confirmModal.planId) return
    
    setProcessingId(confirmModal.planId)
    const { error } = await supabase.from('plans').delete().eq('id', confirmModal.planId)
    
    if (!error) {
      setToast({ message: 'Plan deleted successfully!', type: 'success' })
      fetchPlans()
    } else {
      setToast({ message: 'Error: ' + error.message, type: 'error' })
    }
    
    setConfirmModal({ isOpen: false, planId: null, action: 'cancel' })
    setProcessingId(null)
  }

  const openEdit = (plan: any) => {
    setFormData({ name: plan.name, price: plan.price.toString() })
    setEditId(plan.id)
    setShowModal(true)
  }

  // --- Stats & Filtering ---
  const stats = useMemo(() => ({
    totalPlans: plans.length,
    totalRevenue: plans.reduce((acc, plan) => acc + plan.price, 0),
    avgPrice: plans.length > 0 ? Math.round(plans.reduce((acc, plan) => acc + plan.price, 0) / plans.length) : 0,
  }), [plans])

  const filteredPlans = useMemo(() => {
    if (!searchQuery) return plans
    return plans.filter((plan: any) => 
      plan.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [plans, searchQuery])

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Live Connection Indicator */}
      <div className="flex items-center justify-between mb-8">
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Service Plans
          </h2>
          <p className="text-slate-400 mt-1">Manage your internet service packages</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { setEditId(null); setFormData({ name: '', price: '' }); setShowModal(true) }} 
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
          >
            <Plus size={20} /> Add Plan
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-cyan-400 font-semibold">Total Plans</p>
            <Tag size={20} className="text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalPlans}</p>
        </div>
        <div className="p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-400 font-semibold">Avg Price</p>
            <DollarSign size={20} className="text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">₱{stats.avgPrice}</p>
        </div>
        <div className="p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-400 font-semibold">Total Revenue</p>
            <Users size={20} className="text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">₱{stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search plans by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filteredPlans.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <Activity size={48} className="text-slate-600" />
              <h3 className="text-xl font-bold text-slate-300">No Plans Found</h3>
              <p className="text-slate-500">
                {searchQuery ? 'Try adjusting your search' : 'Add a plan to get started'}
              </p>
            </div>
          </div>
        ) : (
          filteredPlans.map((plan: any) => (
            <div 
              key={plan.id} 
              className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-600/20 rounded-lg group-hover:bg-cyan-600/30 transition-colors">
                    <Tag className="text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{plan.name}</h3>
                    <p className="text-cyan-400 font-bold text-xl">₱{plan.price.toLocaleString()}</p>
                  </div>
                </div>
                
                {/* Admin Only: Edit & Delete Buttons */}
                                {isAdmin && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEdit(plan)} 
                      className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors"
                      title="Edit Plan"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(plan.id)} 
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editId ? 'Edit Plan' : 'Add New Plan'}
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Plan Name</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all" 
                  placeholder="e.g., Home 20Mbps"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Price (₱)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all" 
                  placeholder="e.g., 499"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={processingId === 'saving'}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-2.5 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {processingId === 'saving' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editId ? 'Update Plan' : 'Add Plan'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, planId: null, action: 'cancel' })}
        onConfirm={confirmDelete}
        title="Delete Plan"
        message="Are you sure you want to delete this plan? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

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