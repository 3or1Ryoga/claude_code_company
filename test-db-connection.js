// Emergency DB Connection Test
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Emergency Database Connection Test')
console.log('=====================================')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')
  process.exit(1)
}

console.log('✅ Environment variables found')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey.substring(0, 20) + '...')

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n🔌 Testing basic connection...')
    
    // Test basic connection
    const { data, error } = await supabase.from('projects').select('count(*)', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Basic connection successful')
    console.log('Projects table count:', data || 'Unable to count')
    
    // Test concepts table
    console.log('\n📋 Testing concepts table...')
    const { data: conceptsData, error: conceptsError } = await supabase
      .from('concepts')
      .select('count(*)', { count: 'exact', head: true })
    
    if (conceptsError) {
      console.error('❌ Concepts table error:', conceptsError.message)
      if (conceptsError.code === '42P01') {
        console.log('💡 Table does not exist - needs to be created')
      }
      return false
    }
    
    console.log('✅ Concepts table accessible')
    console.log('Concepts table count:', conceptsData || 'Unable to count')
    
    // Test RLS policies
    console.log('\n🔒 Testing RLS policies...')
    const { data: authData } = await supabase.auth.getUser()
    
    if (!authData.user) {
      console.log('⚠️ No authenticated user - RLS will block operations')
    } else {
      console.log('✅ User authenticated:', authData.user.email)
    }
    
    return true
    
  } catch (err) {
    console.error('💥 Unexpected error:', err.message)
    return false
  }
}

// Run the test
testConnection().then(success => {
  console.log('\n📊 Test Results')
  console.log('================')
  console.log(success ? '✅ Connection test PASSED' : '❌ Connection test FAILED')
  process.exit(success ? 0 : 1)
})