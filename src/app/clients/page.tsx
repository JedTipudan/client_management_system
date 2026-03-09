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
  Loader2,
} from 'lucide-react'

export default function ClientsPage() {

  const [clients, setClients] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])

  const [search, setSearch] = useState('')
  const [locFilter, setLocFilter] = useState('All')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<any>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    client_name: '',
    contact_number: '',
    location: '',
    plan_id: '',
    installation_date: '',
    status: 'active',
  })

  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // =============================
  // AUTH
  // =============================

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      setUser(u)

      if (u?.email === 'ronnelpaciano.1986@gmail.com') {
        setIsAdmin(true)
      }
    })
  }, [])

  // =============================
  // FETCH
  // =============================

  const fetchData = async () => {

    setIsLoading(true)

    const [c, p, l] = await Promise.all([
      supabase.from('clients').select('*, plans(name,price)'),
      supabase.from('plans').select('*'),
      supabase.from('locations').select('*').order('name'),
    ])

    setClients(c.data || [])
    setPlans(p.data || [])
    setLocations(l.data || [])

    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // =============================
  // FILTER
  // =============================

  const filteredClients = useMemo(() => {

    return clients
      .filter(
        (c) =>
          locFilter === 'All' ||
          c.location === locFilter
      )
      .filter(
        (c) =>
          c.client_name
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          c.contact_number?.includes(search)
      )

  }, [clients, search, locFilter])

  const totalItems = filteredClients.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const currentData =
    filteredClients.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )

  // =============================
  // SAVE
  // =============================

  const handleSave = async () => {

    if (!formData.client_name) return

    setProcessingId('saving')

    if (editId) {

      await supabase
        .from('clients')
        .update(formData)
        .eq('id', editId)

    } else {

      await supabase
        .from('clients')
        .insert(formData)

    }

    setShowModal(false)
    setEditId(null)
    setProcessingId(null)

    fetchData()
  }

  // =============================
  // DELETE
  // =============================

  const handleDelete = async (id: any) => {

    if (!confirm('Delete client?')) return

    setProcessingId(id)

    await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    setProcessingId(null)

    fetchData()
  }

  // =============================
  // STATS
  // =============================

  const stats = {

    total: clients.length,

    active:
      clients.filter(
        (c) => c.status === 'active'
      ).length,

    inactive:
      clients.filter(
        (c) => c.status === 'inactive'
      ).length,
  }

  // =============================
  // UI
  // =============================

  return (

    <div className="min-h-screen bg-slate-950 text-white px-6 py-6 w-full">

      {/* HEADER */}

      <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-700 flex justify-between">

        <div>
          <h2 className="text-2xl font-bold text-cyan-400">
            Clients Dashboard
          </h2>
          <p className="text-slate-400 text-sm">
            Client Management System
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={fetchData}
            className="bg-slate-700 px-4 py-2 rounded"
          >
            <RefreshCw size={16} />
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setEditId(null)
                setShowModal(true)
              }}
              className="bg-cyan-600 px-4 py-2 rounded"
            >
              <Plus size={16} /> Add
            </button>
          )}

        </div>

      </div>

      {/* STATS */}

      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="p-4 bg-slate-900 border border-slate-700 rounded">
          Total
          <div className="text-2xl text-cyan-400">
            {stats.total}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-700 rounded">
          Active
          <div className="text-2xl text-green-400">
            {stats.active}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-700 rounded">
          Inactive
          <div className="text-2xl text-red-400">
            {stats.inactive}
          </div>
        </div>

      </div>

      {/* FILTER */}

      <div className="flex gap-4 mb-4">

        <input
          placeholder="Search"
          className="bg-slate-900 border border-slate-700 px-3 py-2 rounded"
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          className="bg-slate-900 border border-slate-700 px-3 py-2 rounded"
          onChange={(e) =>
            setLocFilter(e.target.value)
          }
        >
          <option>All</option>

          {locations.map((l: any) => (
            <option key={l.id}>
              {l.name}
            </option>
          ))}
        </select>

      </div>

      {/* TABLE */}

      <div className="overflow-x-auto border border-slate-700 rounded">

        <table className="w-full text-left">

          <thead className="bg-slate-900 sticky top-0">

            <tr>

              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Plan</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>

            </tr>

          </thead>

          <tbody>

            {isLoading && (
              <tr>
                <td colSpan={7}>
                  Loading...
                </td>
              </tr>
            )}

            {currentData.map((c) => (

              <tr
                key={c.id}
                className="hover:bg-slate-800"
              >

                <td className="px-4 py-2">
                  {c.client_name}
                </td>

                <td className="px-4 py-2">
                  {c.contact_number}
                </td>

                <td className="px-4 py-2">
                  {c.location}
                </td>

                <td className="px-4 py-2">
                  {c.plans?.name}
                </td>

                <td className="px-4 py-2">
                  {c.installation_date}
                </td>

                <td className="px-4 py-2">
                  {c.status}
                </td>

                <td className="px-4 py-2 flex gap-2">

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setEditId(c.id)
                          setFormData(c)
                          setShowModal(true)
                        }}
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(c.id)
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  )
}