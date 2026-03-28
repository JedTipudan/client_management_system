'use client'

export default function FixDueDatesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-400">This page has been disabled.</h2>
        <p className="text-slate-400 mt-2">Please fix due dates manually in Supabase dashboard.</p>
      </div>
    </div>
  )
}

export default function FixDueDatesPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const calculateDueDate = (installDate: string) => {
    if (!installDate) return null
    const [year, month, day] = installDate.split('-').map(Number)
    let newMonth = month + 1
    let newYear = year
    if (newMonth > 12) { 
      newMonth = 1
      newYear = year + 1 
    }
    const daysInNewMonth = new Date(newYear, newMonth, 0).getDate()
    const finalDay = Math.min(day, daysInNewMonth)
    return `${newYear}-${String(newMonth).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}`
  }

  const fixAllDueDates = async () => {
    setIsProcessing(true)
    setResults([])
    setError(null)

    try {
      const { data: clients, error: fetchError } = await supabase
        .from('clients')
        .select('*')
      
      if (fetchError) throw fetchError

      const updates: string[] = []
      
      for (const client of clients || []) {
        if (client.installation_date) {
          const firstDueDate = calculateDueDate(client.installation_date)
          
          // Only fix if due_date is null or if due_date is before the first calculated due date
          // This prevents overwriting clients who have already paid
          if (!client.due_date) {
            const { error: updateError } = await supabase
              .from('clients')
              .update({ due_date: firstDueDate })
              .eq('id', client.id)
            
            if (updateError) {
              updates.push(`❌ ${client.client_name}: Error - ${updateError.message}`)
            } else {
              updates.push(`✓ ${client.client_name}: Set to ${firstDueDate}`)
            }
          } else {
            const clientDueDate = new Date(client.due_date)
            const calculatedDueDate = new Date(firstDueDate!)
            
            // Only update if current due date is before the first calculated due date
            // This means they haven't paid yet
            if (clientDueDate < calculatedDueDate) {
              const { error: updateError } = await supabase
                .from('clients')
                .update({ due_date: firstDueDate })
                .eq('id', client.id)
              
              if (updateError) {
                updates.push(`❌ ${client.client_name}: Error - ${updateError.message}`)
              } else {
                updates.push(`✓ ${client.client_name}: ${client.due_date} → ${firstDueDate}`)
              }
            } else {
              updates.push(`- ${client.client_name}: Already paid (${client.due_date})`)
            }
          }
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
        <p className="text-slate-400 mb-8">
          This will recalculate all due dates based on installation dates. 
          Due dates will follow the installation day, adjusting for months with fewer days.
        </p>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">How it works:</h3>
          <ul className="space-y-2 text-slate-300">
            <li>• Installation on Jan 30 → Due date: Feb 28 (Feb has only 28 days)</li>
            <li>• After payment → Next due: Mar 30 (back to 30th)</li>
            <li>• After payment → Next due: Apr 30</li>
            <li>• Installation on Jan 31 → Due date: Feb 28 (Feb has only 28 days)</li>
            <li>• After payment → Next due: Mar 31 (back to 31st)</li>
          </ul>
        </div>

        <button
          onClick={fixAllDueDates}
          disabled={isProcessing}
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 px-6 py-3 rounded-lg text-white font-bold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={20} className={isProcessing ? 'animate-spin' : ''} />
          {isProcessing ? 'Processing...' : 'Fix All Due Dates'}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="font-bold">Error:</span> {error}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={24} className="text-green-400" />
              <h3 className="text-xl font-bold text-white">Results:</h3>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`text-sm font-mono p-2 rounded ${
                    result.startsWith('✓') ? 'text-green-400 bg-green-500/5' :
                    result.startsWith('❌') ? 'text-red-400 bg-red-500/5' :
                    'text-slate-400'
                  }`}
                >
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
