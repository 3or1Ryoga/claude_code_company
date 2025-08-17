#!/usr/bin/env node

// API Concepts Route Test Script
// Tests the /api/concepts endpoint functionality

console.log('🧪 API Concepts Route Testing Started')

const testData = {
  siteName: 'Test Concept Site',
  brief: 'Testing concept API endpoint',
  problem: 'Testing problem field',
  affinity: 'Testing affinity field', 
  solution: 'Testing solution field',
  offer: 'Testing offer field',
  narrowingDown: 'Testing narrowing down field',
  action: 'Testing action field',
  primary: '#0EA5E9',
  accent: '#9333EA', 
  background: '#0B1221',
  nav: 'Home,About,Contact',
  logoText: 'Test Logo',
  x: 'test_x',
  linkedin: 'test_linkedin',
  github: 'test_github',
  email: 'test@example.com',
  url: 'https://example.com'
}

// Test 1: Check if API endpoint exists
console.log('\n📋 Test 1: API Endpoint Accessibility')
try {
  const response = await fetch('http://localhost:3000/api/concepts', {
    method: 'HEAD'
  })
  console.log(`✅ API endpoint accessible: ${response.status}`)
} catch (error) {
  console.log(`❌ API endpoint not accessible: ${error.message}`)
  console.log('💡 Make sure Next.js dev server is running: npm run dev')
  process.exit(1)
}

// Test 2: POST request with test data
console.log('\n📋 Test 2: POST Request Functionality')
try {
  const response = await fetch('http://localhost:3000/api/concepts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testData)
  })
  
  const responseText = await response.text()
  console.log(`📊 Response Status: ${response.status}`)
  console.log(`📄 Response Headers:`, Object.fromEntries(response.headers.entries()))
  console.log(`📝 Response Body: ${responseText}`)
  
  if (response.status === 401) {
    console.log('⚠️ Authentication required - this is expected for protected routes')
  } else if (response.status === 500) {
    console.log('❌ Server error detected')
    try {
      const errorData = JSON.parse(responseText)
      console.log('🔍 Error details:', errorData)
    } catch (e) {
      console.log('🔍 Raw error response:', responseText)
    }
  } else if (response.status === 200) {
    console.log('✅ API request successful')
    try {
      const successData = JSON.parse(responseText)
      console.log('📊 Success data:', successData)
    } catch (e) {
      console.log('📊 Raw success response:', responseText)
    }
  }
  
} catch (error) {
  console.log(`❌ POST request failed: ${error.message}`)
}

// Test 3: Input validation test
console.log('\n📋 Test 3: Input Validation')
try {
  const invalidData = { /* empty object */ }
  const response = await fetch('http://localhost:3000/api/concepts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(invalidData)
  })
  
  console.log(`📊 Validation Response Status: ${response.status}`)
  const responseText = await response.text()
  console.log(`📝 Validation Response: ${responseText}`)
  
} catch (error) {
  console.log(`❌ Validation test failed: ${error.message}`)
}

console.log('\n🎯 API Concepts Route Testing Complete')