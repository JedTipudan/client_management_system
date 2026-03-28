'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

export default function FixDueDatesPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const getCorrectDueDate = (installDate: string) => {
    const [year, month, day] = installDate.split('-').map(Number)
    let newMonth = month + 1
    let newYear = year
    if (newMonth > 12) { newMonth = 1; newYear = year + 1 }
    const daysInNewMonth = new Date(newYear, newMonth, 0).getDate()
    const finalDay = Math.min(day, daysInNewMonth)
    return `${newYear}-${String(newMonth).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}`
  }

  const fixDueDates = async () => {
    setIsProcessing(true)
    setResults([])
    setError(null)

    try {
      const { data: clients, error: fetchError } = await supabase.from('clients').select('*')
      if (fetchError) throw fetchError

      const updates: string[] = []
      const today = new Date().toISOString().split('T')[0]

      for (const client of clients || []) {
        if (!client.installation_date) continue

        const correctDueDate = getCorrectDueDate(client.installation_date)

        // Skip clients whose due_date is in the future (already paid)
        if (client.due_date && client.due_date > today) {
          updates.push(`- ${client.client_name}: Skipped (already paid, due ${client.due_date})`)
          continue
        }

        // Only fix if due_date is wrong or missing
        if (client.due_date === correctDueDate) {
          updates.push(`- ${client.client_name}: Already correct (${client.due_date})`)
          continue
        }

        const { error: updateError } = await supabase
          .from('clients')
          .update({ due_date: correctDueDate })
          .eq('id', client.id)

        if (updateError) {
          updates.push(`❌ ${client.client_name}: Error - ${updateError.message}`)
        } else {
          updates.push(`✓ ${client.client_name}: ${client.due_date || 'none'} → ${correctDueDate}`)
        }
      }

      setResults(updates)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">
          Fix Due Dates
        </h2>
        <p className="text-slate-400 mb-2">This will only fix clients whose due date is <span className="text-white font-bold">wrong or missing</span>.</p>
        <p className="text-green-400 mb-8 font-semibold">✓ Clients who already paid (future due date) will be skipped automatically.</p>

        <button
          onClick={fixDueDates}
          disabled={isProcessing}
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 px-6 py-3 rounded-lg text-white font-bold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          <RefreshCw size={20} className={isProcessing ? 'animate-spin' : ''} />
          {isProcessing ? 'Processing...' : 'Fix Due Dates (Safe)'}
        </button>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2 mb-6">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={24} className="text-green-400" />
              <h3 className="text-xl font-bold text-white">Results ({results.length} clients processed):</h3>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className={`text-sm font-mono p-2 rounded ${
                  result.startsWith('✓') ? 'text-green-400 bg-green-500/5' :
                  result.startsWith('❌') ? 'text-red-400 bg-red-500/5' :
                  'text-slate-400'
                }`}>
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
