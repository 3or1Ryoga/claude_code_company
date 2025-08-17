// 🚨 CRITICAL TABLE EXISTENCE CHECK
import { createClient } from '@supabase/supabase-js'

const url = 'https://cisjwiegbvydbbjwpthz.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpc2p3aWVnYnZ5ZGJiandwdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzAyNDQsImV4cCI6MjA2OTk0NjI0NH0.4dWYAdylou56Kcf8uychAgxpLxNuzQ__Fk5em6mQC8k'

console.log('🚨 CRITICAL TABLE CHECK')
console.log('=====================')

const supabase = createClient(url, key)

// Check concepts table
console.log('Checking concepts table...')
const { data: conceptsData, error: conceptsError } = await supabase
  .from('concepts')
  .select('*')
  .limit(1)

console.log('❌ Concepts table ERROR:', conceptsError?.message || 'None')
console.log('📋 Concepts table EXISTS:', !conceptsError ? 'YES' : 'NO')

// Check projects table  
console.log('\nChecking projects table...')
const { data: projectsData, error: projectsError } = await supabase
  .from('projects')
  .select('*')
  .limit(1)

console.log('📋 Projects table ERROR:', projectsError?.message || 'None')
console.log('📋 Projects table EXISTS:', !projectsError ? 'YES' : 'NO')

console.log('\n🚨 CRITICAL STATUS:')
console.log('CONCEPTS TABLE:', !conceptsError ? '✅ EXISTS' : '❌ MISSING')
console.log('PROJECTS TABLE:', !projectsError ? '✅ EXISTS' : '❌ MISSING')