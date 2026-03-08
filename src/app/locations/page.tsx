'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { 
  Plus, 
  Trash2, 
  X, 
  MapPin, 
  Search, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  Loader2,
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
    <div className="flex justify-end">
      <div className="h-8 w-8 bg-slate-700/50 rounded"></div>
    </div>
  </div>
)

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '' })
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [lastSync, setLastSync] = useState<Date>(new Date())
  const [searchQuery, setSearchQuery] = useState('')
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
      .channel('locations_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, (payload) => {
        console.log('Location change received!', payload)
        fetchLocations()
        setLastSync(new Date())
        setIsLive(true)
        setTimeout(() => setIsLive(false), 2000)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchLocations = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('locations').select('*').order('name')
    setLocations(data || [])
    setIsLoading(false)
    setLastSync(new Date())
  }

  useEffect(() => { fetchLocations() }, [])

  // --- Actions ---
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setToast({ message: 'Please enter location name', type: 'error' })
      return
    }

    setProcessingId('saving')
    const { error } = await supabase.from('locations').insert({ name: formData.name.trim() })
    
    if (!error) {
      setToast({ message: 'Location added successfully!', type: 'success' })
    } else {
      setToast({ message: 'Error: ' + error.message, type: 'error' })
    }
    
    setShowModal(false)
    setFormData({ name: '' })
    setProcessingId(null)
    fetchLocations()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this location? This action cannot be undone.')) {
      setProcessingId(id)
      const { error } = await supabase.from('locations').delete().eq('id', id)
      
      if (!error) {
        setToast({ message: 'Location deleted successfully!', type: 'success' })
        fetchLocations()
      } else {
        setToast({ message: 'Error: ' + error.message, type: 'error' })
      }
      
      setProcessingId(null)
    }
  }

  // --- Stats & Filtering ---
  const stats = useMemo(() => ({
    totalLocations: locations.length,
    totalClients: locations.reduce((acc, loc) => acc + (loc.client_count || 0), 0),
  }), [locations])

  const filteredLocations = useMemo(() => {
    if (!searchQuery) return locations
    return locations.filter((loc: any) => 
      loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [locations, searchQuery])

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
            Service Locations
          </h2>
          <p className="text-slate-400 mt-1">Manage your service coverage areas</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { setFormData({ name: '' }); setShowModal(true) }} 
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
          >
            <Plus size={20} /> Add Location
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-5 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-cyan-400 font-semibold">Total Locations</p>
            <MapPin size={20} className="text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalLocations}</p>
        </div>
        <div className="p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-400 font-semibold">Total Clients</p>
            <Users size={20} className="text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalClients}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search locations by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filteredLocations.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <Activity size={48} className="text-slate-600" />
              <h3 className="text-xl font-bold text-slate-300">No Locations Found</h3>
              <p className="text-slate-500">
                {searchQuery ? 'Try adjusting your search' : 'Add a location to get started'}
              </p>
            </div>
          </div>
        ) : (
          filteredLocations.map((loc: any) => (
            <div 
              key={loc.id} 
              className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-600/20 rounded-lg group-hover:bg-cyan-600/30 transition-colors">
                    <MapPin className="text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{loc.name}</h3>
                    <p className="text-slate-400 text-sm">Location</p>
                  </div>
                </div>
                
                {/* Admin Only: Delete Button */}
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(loc.id)} 
                    disabled={processingId === loc.id}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete Location"
                  >
                    {processingId === loc.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Location Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Location</h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Location Name</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all" 
                  placeholder="e.g., Poblacion"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  autoFocus
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
                      Adding...
                    </>
                  ) : (
                    'Add Location'
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