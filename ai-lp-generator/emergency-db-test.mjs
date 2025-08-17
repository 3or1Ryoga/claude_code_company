#!/usr/bin/env node

// Emergency Database Connection and Table Test
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

console.log('🚨 EMERGENCY DATABASE TEST')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Test 1: Basic connection
console.log('\n📋 Test 1: Supabase Connection')
try {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  })
  
  if (response.ok) {
    console.log('✅ Supabase connection successful')
  } else {
    console.log(`❌ Supabase connection failed: ${response.status}`)
  }
} catch (error) {
  console.log(`❌ Connection error: ${error.message}`)
}

// Test 2: Concepts table check
console.log('\n📋 Test 2: Concepts Table Check')
try {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/concepts?select=count`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Range': '0-0'
    }
  })
  
  if (response.ok) {
    console.log('✅ Concepts table exists and accessible')
    const data = await response.text()
    console.log(`📊 Response: ${data}`)
  } else if (response.status === 406) {
    console.log('⚠️ Concepts table exists but may have schema issues')
  } else {
    console.log(`❌ Concepts table access failed: ${response.status}`)
    const errorText = await response.text()
    console.log(`🔍 Error details: ${errorText}`)
  }
} catch (error) {
  console.log(`❌ Table check error: ${error.message}`)
}

console.log('\n🏁 Emergency Database Test Complete')
