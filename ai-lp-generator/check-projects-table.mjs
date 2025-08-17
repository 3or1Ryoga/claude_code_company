// 🚨 Check existing projects table for deletion consideration
import { createClient } from '@supabase/supabase-js'

const url = 'https://cisjwiegbvydbbjwpthz.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpc2p3aWVnYnZ5ZGJiandwdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzAyNDQsImV4cCI6MjA2OTk0NjI0NH0.4dWYAdylou56Kcf8uychAgxpLxNuzQ__Fk5em6mQC8k'

console.log('🚨 PROJECTS TABLE ANALYSIS')
console.log('==========================')

const supabase = createClient(url, key)

try {
  // Check if projects table has any data
  const { data: projectsData, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .limit(10)

  if (projectsError) {
    console.log('❌ Projects table error:', projectsError.message)
  } else {
    console.log('✅ Projects table accessible')
    console.log('📊 Records found:', projectsData.length)
    
    if (projectsData.length > 0) {
      console.log('⚠️ PROJECTS TABLE HAS DATA - DO NOT DELETE')
      console.log('📋 Sample record fields:', Object.keys(projectsData[0]))
    } else {
      console.log('🗑️ Projects table is empty - safe to delete if needed')
    }
  }

  // Check table structure
  console.log('\n📋 Checking table structure...')
  const { data: structureData, error: structureError } = await supabase
    .from('projects')
    .select('*')
    .limit(0)

  if (!structureError) {
    console.log('✅ Projects table structure accessible')
  }

} catch (err) {
  console.error('💥 Error:', err.message)
}

console.log('\n🚨 RECOMMENDATION:')
console.log('- If projects table has data: KEEP IT')
console.log('- If projects table is empty: CONSIDER DELETION')
console.log('- Focus on creating concepts table first')