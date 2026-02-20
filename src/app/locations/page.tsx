'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Plus, Trash2, X, MapPin } from 'lucide-react'

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '' })

  useEffect(() => { fetchLocations() }, [])

  const fetchLocations = async () => {
    const { data } = await supabase.from('locations').select('*').order('name')
    setLocations(data || [])
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Please enter location name")
      return
    }

    await supabase.from('locations').insert({ name: formData.name.trim() })
    
    setShowModal(false)
    setFormData({ name: '' })
    fetchLocations()
  }

  const handleDelete = async (id: string) => {
    if(confirm('Delete this location?')) {
      await supabase.from('locations').delete().eq('id', id)
      fetchLocations()
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold">Locations</h2>
        <button onClick={() => { setFormData({ name: '' }); setShowModal(true) }} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold">
          <Plus size={20} /> Add Location
        </button>
      </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc: any) => (
          <div key={loc.id} className="bg-transparent backdrop-blur-sm backdrop-blur-sm p-6 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-600/20 rounded-lg">
                  <MapPin className="text-cyan-400" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{loc.name}</h3>
                  <p className="text-slate-400 text-sm">Location</p>
                </div>
              </div>
              <button onClick={() => handleDelete(loc.id)} className="text-red-400 hover:text-red-300">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        
        {locations.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No locations yet. Add a location to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add New Location</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Location Name</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" 
                  placeholder="e.g., Poblacion"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700">Cancel</button>
                <button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 px-6 py-2 rounded-lg font-bold">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}