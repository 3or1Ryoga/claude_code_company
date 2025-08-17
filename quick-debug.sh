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

