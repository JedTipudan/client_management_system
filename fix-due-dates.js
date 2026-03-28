// Run this script once to fix all due dates in the database
// node fix-due-dates.js

const { createClient } = require('@supabase/supabase-js')

// Replace with your Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

const calculateDueDate = (installDate) => {
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

async function fixDueDates() {
  console.log('Fetching all clients...')
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
  
  if (error) {
    console.error('Error fetching clients:', error)
    return
  }

  console.log(`Found ${clients.length} clients`)
  
  for (const client of clients) {
    if (client.installation_date) {
      const correctDueDate = calculateDueDate(client.installation_date)
      
      if (correctDueDate && correctDueDate !== client.due_date) {
        console.log(`Fixing ${client.client_name}: ${client.due_date} → ${correctDueDate}`)
        
        const { error: updateError } = await supabase
          .from('clients')
          .update({ due_date: correctDueDate })
          .eq('id', client.id)
        
        if (updateError) {
          console.error(`Error updating ${client.client_name}:`, updateError)
        } else {
          console.log(`✓ Fixed ${client.client_name}`)
        }
      }
    }
  }
  
  console.log('Done!')
}

fixDueDates()
