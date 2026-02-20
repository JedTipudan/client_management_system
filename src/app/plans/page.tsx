'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Plus, Trash2, X, Edit, Tag } from 'lucide-react'

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', price: '' })
  const [editId, setEditId] = useState<any>(null)

  useEffect(() => { fetchPlans() }, [])

  const fetchPlans = async () => {
    const { data } = await supabase.from('plans').select('*').order('name')
    setPlans(data || [])
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price) {
      alert("Please fill in plan name and price")
      return
    }

    const price = parseFloat(formData.price)

    if (editId) {
      await supabase.from('plans').update({ name: formData.name.trim(), price }).eq('id', editId)
    } else {
      await supabase.from('plans').insert({ name: formData.name.trim(), price })
    }
    
    setShowModal(false)
    setFormData({ name: '', price: '' })
    fetchPlans()
  }

  const handleDelete = async (id: string) => {
    if(confirm('Delete this plan?')) {
      await supabase.from('plans').delete().eq('id', id)
      fetchPlans()
    }
  }

  const openEdit = (plan: any) => {
    setFormData({ name: plan.name, price: plan.price.toString() })
    setEditId(plan.id)
    setShowModal(true)
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold">Plans</h2>
        <button onClick={() => { setEditId(null); setFormData({ name: '', price: '' }); setShowModal(true) }} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold">
          <Plus size={20} /> Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan: any) => (
          <div key={plan.id} className="bg-gradient-to-br from-yellow-500/10 to-orange-600/10 backdrop-blur-sm p-6 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-600/20 rounded-lg">
                  <Tag className="text-cyan-400" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-cyan-400 font-bold text-xl">₱{plan.price}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(plan)} className="text-cyan-400 hover:text-cyan-300">
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDelete(plan.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {plans.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No plans yet. Add a plan to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editId ? 'Edit Plan' : 'Add New Plan'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Plan Name</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" 
                  placeholder="e.g., Home 20Mbps"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Price (₱)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" 
                  placeholder="e.g., 499"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700">Cancel</button>
                <button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 px-6 py-2 rounded-lg font-bold">{editId ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}