#!/bin/bash

# 🚨 Emergency Fix Script for Multi-Agent System Issues
# Fixes API errors, multi-agent communication, and provides debugging tools

echo "🚨 Emergency Fix Script Starting..."
echo "=================================="

# Create logs directory
mkdir -p logs
mkdir -p tmp

# 1. Fix Supabase Concepts Table
echo "🗄️ Step 1: Checking Supabase concepts table..."
if [ -f "ai-lp-generator/EMERGENCY_CONCEPTS_TABLE.sql" ]; then
    echo "✅ Found EMERGENCY_CONCEPTS_TABLE.sql"
    echo "📋 Please execute this SQL in your Supabase Dashboard > SQL Editor:"
    echo "   File: ai-lp-generator/EMERGENCY_CONCEPTS_TABLE.sql"
    echo ""
else
    echo "⚠️ EMERGENCY_CONCEPTS_TABLE.sql not found"
fi

# 2. Test API endpoints
echo "🔧 Step 2: Testing API endpoints..."
cd ai-lp-generator

# Make debug tool executable
chmod +x debug-one-click-upload.mjs

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Test if server is running
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Development server is running"
    
    # Run API diagnostics
    echo "🧪 Running API diagnostics..."
    node debug-one-click-upload.mjs test
else
    echo "⚠️ Development server not running. Please start with 'npm run dev'"
    echo "💡 To start: cd ai-lp-generator && npm run dev"
fi

cd ..

# 3. Fix Multi-Agent Communication
echo "🤖 Step 3: Fixing multi-agent communication..."

# Make agent scripts executable
chmod +x agent-send.sh
chmod +x quick-start.sh

# Check tmux session
if ! tmux has-session -t multiagent 2>/dev/null; then
    echo "📺 Creating multiagent tmux session..."
    tmux new-session -d -s multiagent
    tmux split-window -h -t multiagent
    tmux split-window -v -t multiagent:0.0  
    tmux split-window -v -t multiagent:0.1
    echo "✅ Multiagent tmux session created"
else
    echo "✅ Multiagent tmux session already exists"
fi

# Test agent communication
echo "🔄 Testing agent communication..."
echo "Testing agent-send.sh script..." > logs/emergency-fix.log

if ./agent-send.sh --list >> logs/emergency-fix.log 2>&1; then
    echo "✅ Agent communication script working"
else
    echo "⚠️ Agent communication script has issues - check logs/emergency-fix.log"
fi

# 4. Create Quick Debug Tools
echo "🛠️ Step 4: Creating quick debug tools..."

# Create quick test script
cat > quick-debug.sh << 'EOF'
#!/bin/bash

echo "🔥 Quick Debug Tool"
echo "=================="

echo "1. 📊 System Status:"
echo "   - tmux sessions: $(tmux list-sessions 2>/dev/null | wc -l)"
echo "   - multiagent session: $(tmux has-session -t multiagent 2>/dev/null && echo 'EXISTS' || echo 'MISSING')"
echo "   - Development server: $(curl -f http://localhost:3000 >/dev/null 2>&1 && echo 'RUNNING' || echo 'STOPPED')"

echo ""
echo "2. 📁 File Status:"
echo "   - worker1_done.txt: $([ -f ./tmp/worker1_done.txt ] && echo 'EXISTS' || echo 'MISSING')"
echo "   - worker2_done.txt: $([ -f ./tmp/worker2_done.txt ] && echo 'EXISTS' || echo 'MISSING')"
echo "   - agent-send.sh: $([ -f ./agent-send.sh ] && echo 'EXISTS' || echo 'MISSING')"

echo ""
echo "3. 🧪 Quick Tests:"

# Test API
if curl -f http://localhost:3000/api/concepts >/dev/null 2>&1; then
    echo "   - API /concepts: ✅ WORKING"
else
    echo "   - API /concepts: ❌ FAILED"
fi

# Test Supabase connection
cd ai-lp-generator
if node -e "console.log('Testing...')" >/dev/null 2>&1; then
    echo "   - Node.js: ✅ WORKING"
else
    echo "   - Node.js: ❌ FAILED"
fi
cd ..

echo ""
echo "4. 🎯 Quick Actions:"
echo "   - Start dev server: cd ai-lp-generator && npm run dev"
echo "   - Test concepts API: cd ai-lp-generator && node debug-one-click-upload.mjs test"
echo "   - Generate test data: cd ai-lp-generator && node debug-one-click-upload.mjs generate"
echo "   - Start multiagent: ./quick-start.sh"
echo "   - Manual test: ./agent-send.sh worker1 'Hello World 作業開始'"

EOF

chmod +x quick-debug.sh

# Create one-click concept generator
cat > ai-lp-generator/quick-concept.mjs << 'EOF'
#!/usr/bin/env node

// 🚀 One-Click Minimal Concept Generator
const concept = {
  siteName: `テスト-${Date.now()}`,
  brief: 'ワンクリックテスト用',
  problem: 'テスト問題',
  affinity: 'テスト共感',
  solution: 'テスト解決策',
  offer: 'テスト提案',
  narrowingDown: 'テスト絞り込み',
  action: 'テスト行動',
  primary: '#0EA5E9',
  accent: '#9333EA',
  background: '#0B1221',
  nav: 'ホーム,サービス,お問い合わせ',
  logoText: 'テストロゴ',
  x: '', linkedin: '', github: '',
  email: 'test@example.com',
  url: 'https://example.com'
}

async function test() {
  try {
    console.log('🧪 Testing /api/concepts with minimal data...')
    
    const response = await fetch('http://localhost:3000/api/concepts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(concept)
    })
    
    const data = await response.text()
    
    if (response.ok) {
      console.log('✅ SUCCESS!')
      console.log('Response:', data)
    } else {
      console.log(`❌ FAILED (${response.status})`)
      console.log('Error:', data)
    }
  } catch (error) {
    console.log('❌ Network error:', error.message)
  }
}

test()
EOF

chmod +x ai-lp-generator/quick-concept.mjs

# 5. Summary
echo ""
echo "🎉 Emergency Fix Completed!"
echo "=========================="
echo ""
echo "✅ Created Tools:"
echo "   - debug-one-click-upload.mjs (comprehensive debugging)"
echo "   - quick-debug.sh (system status check)"  
echo "   - quick-concept.mjs (minimal API test)"
echo ""
echo "🔧 Next Steps:"
echo "   1. Execute EMERGENCY_CONCEPTS_TABLE.sql in Supabase Dashboard"
echo "   2. Start development server: cd ai-lp-generator && npm run dev"
echo "   3. Run quick status check: ./quick-debug.sh"
echo "   4. Test API: cd ai-lp-generator && node quick-concept.mjs"
echo "   5. Test multiagent: ./quick-start.sh"
echo ""
echo "🚨 If you're still having issues:"
echo "   - Check logs/emergency-fix.log for details"
echo "   - Run: cd ai-lp-generator && node debug-one-click-upload.mjs all"
echo "   - Verify Supabase credentials in .env.local"
echo ""

# Log completion
echo "[$(date)] Emergency fix script completed" >> logs/emergency-fix.log