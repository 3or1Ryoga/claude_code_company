#!/usr/bin/env node

import fetch from 'node-fetch'

async function testAPIUpdate() {
  try {
    console.log('🧪 Testing API Update Endpoint...\n')
    
    // Test with a database UUID (this should now work with our mapping fix)
    const testProjectId = '550e8400-e29b-41d4-a716-446655440000' // Example UUID
    const testContent = `
export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-center py-20">
        Test Update - ${new Date().toISOString()}
      </h1>
    </div>
  )
}
`
    
    const apiUrl = `http://localhost:3001/api/projects/${testProjectId}/update`
    console.log('📡 API URL:', apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // In real app, this would be the Supabase JWT
      },
      body: JSON.stringify({
        pageContent: testContent,
        projectInfo: {
          name: 'Test Project',
          description: 'Testing API update'
        }
      })
    })
    
    console.log('📊 Response Status:', response.status)
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()))
    
    const result = await response.text()
    console.log('📊 Response Body:', result)
    
    if (response.ok) {
      console.log('✅ API Update Test PASSED')
    } else {
      console.log('❌ API Update Test FAILED')
    }
    
  } catch (error) {
    console.error('🚨 Test Error:', error)
  }
}

// Test with actual project directory name
async function testDirectProjectName() {
  try {
    console.log('\n🧪 Testing with Direct Project Name...\n')
    
    // Test with actual project directory name
    const actualProjectName = 'ai-20250816030227'
    const testContent = `
export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-100">
      <h1 className="text-4xl font-bold text-center py-20">
        Direct Name Test - ${new Date().toISOString()}
      </h1>
    </div>
  )
}
`
    
    const apiUrl = `http://localhost:3001/api/projects/${actualProjectName}/update`
    console.log('📡 API URL:', apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pageContent: testContent,
        projectInfo: {
          name: 'Direct Test Project',
          description: 'Testing with direct project name'
        }
      })
    })
    
    console.log('📊 Response Status:', response.status)
    
    const result = await response.text()
    console.log('📊 Response Body:', result)
    
    if (response.ok) {
      console.log('✅ Direct Project Name Test PASSED')
    } else {
      console.log('❌ Direct Project Name Test FAILED')
    }
    
  } catch (error) {
    console.error('🚨 Test Error:', error)
  }
}

// Run tests
testAPIUpdate()
testDirectProjectName()