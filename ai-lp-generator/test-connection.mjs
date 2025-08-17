// Emergency DB Connection Test - Simple Version
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cisjwiegbvydbbjwpthz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpc2p3aWVnYnZ5ZGJiandwdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzAyNDQsImV4cCI6MjA2OTk0NjI0NH0.4dWYAdylou56Kcf8uychAgxpLxNuzQ__Fk5em6mQC8k'

console.log('🚨 EMERGENCY DB CONNECTION TEST')
console.log('================================')

const supabase = createClient(supabaseUrl, supabaseKey)

try {
  // Test projects table
  console.log('Testing projects table...')
  const { data: projectsData, error: projectsError } = await supabase
    .from('projects')
    .select('count(*)', { count: 'exact', head: true })
  
  if (projectsError) {
    console.error('❌ Projects table error:', projectsError.message)
  } else {
    console.log('✅ Projects table accessible')
  }
  
  // Test concepts table
  console.log('Testing concepts table...')
  const { data: conceptsData, error: conceptsError } = await supabase
    .from('concepts')
    .select('count(*)', { count: 'exact', head: true })
  
  if (conceptsError) {
    console.error('❌ Concepts table error:', conceptsError.message)
    if (conceptsError.code === '42P01') {
      console.log('💡 Concepts table does NOT exist - must run SQL migration!')
    } else {
      console.log('Error code:', conceptsError.code)
    }
  } else {
    console.log('✅ Concepts table accessible')
  }
  
  console.log('\n📊 EMERGENCY STATUS:')
  console.log('Projects table:', projectsError ? '❌ FAILED' : '✅ OK')
  console.log('Concepts table:', conceptsError ? '❌ FAILED' : '✅ OK')
  
} catch (err) {
  console.error('💥 CRITICAL ERROR:', err.message)
}