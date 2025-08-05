// /api/chat/generate エンドポイントテスト
const http = require('http')

// テスト用のAPIリクエスト関数
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }

    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body)
          resolve({ status: res.statusCode, data: jsonBody })
        } catch (e) {
          resolve({ status: res.statusCode, data: body })
        }
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// サーバーが起動しているかチェック
async function checkServerRunning() {
  try {
    const response = await makeRequest('/api/health')
    return response.status === 200
  } catch (error) {
    return false
  }
}

// 通常のテスト
async function testNormalGeneration() {
  console.log('🧪 通常のAI生成テスト...')
  
  try {
    const response = await makeRequest('/api/chat/generate', 'POST', {
      message: 'Hello, this is a test message.',
      stream: false
    })
    
    console.log('ステータス:', response.status)
    console.log('レスポンス:', response.data)
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ 通常の生成テスト成功')
      return true
    } else {
      console.log('❌ 通常の生成テスト失敗')
      return false
    }
  } catch (error) {
    console.error('❌ テストエラー:', error.message)
    return false
  }
}

// ストリーミングテスト
async function testStreamingGeneration() {
  console.log('🧪 ストリーミング生成テスト...')
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/chat/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }

    const req = http.request(options, (res) => {
      console.log('ストリーミングレスポンス開始...')
      let receivedChunks = 0
      
      res.on('data', (chunk) => {
        receivedChunks++
        const chunkStr = chunk.toString()
        console.log(`チャンク ${receivedChunks}:`, chunkStr.substring(0, 100) + '...')
      })
      
      res.on('end', () => {
        if (receivedChunks > 0) {
          console.log('✅ ストリーミングテスト成功')
          resolve(true)
        } else {
          console.log('❌ ストリーミングテスト失敗')
          resolve(false)
        }
      })
    })

    req.on('error', (err) => {
      console.error('❌ ストリーミングテストエラー:', err.message)
      resolve(false)
    })

    req.write(JSON.stringify({
      message: 'Tell me a short story about AI.',
      stream: true
    }))

    req.end()
  })
}

// エラーハンドリングテスト
async function testErrorHandling() {
  console.log('🧪 エラーハンドリングテスト...')
  
  try {
    // 空のメッセージでテスト
    const response = await makeRequest('/api/chat/generate', 'POST', {
      message: '',
      stream: false
    })
    
    console.log('空メッセージレスポンス:', response)
    
    if (response.status === 400) {
      console.log('✅ エラーハンドリングテスト成功')
      return true
    } else {
      console.log('❌ エラーハンドリングテスト失敗')
      return false
    }
  } catch (error) {
    console.error('❌ エラーハンドリングテストエラー:', error.message)
    return false
  }
}

// メイン実行
async function main() {
  console.log('🚀 /api/chat/generate エンドポイントテスト開始')
  console.log('=' .repeat(60))
  
  // サーバー確認
  console.log('🔍 サーバー起動確認...')
  const serverRunning = await checkServerRunning()
  
  if (!serverRunning) {
    console.log('❌ サーバーが起動していません (http://localhost:3001)')
    console.log('💡 npm run dev を実行してからテストしてください')
    process.exit(1)
  }
  
  console.log('✅ サーバー起動確認完了')
  console.log('')
  
  // テスト実行
  const normalResult = await testNormalGeneration()
  console.log('')
  
  const streamingResult = await testStreamingGeneration()
  console.log('')
  
  const errorResult = await testErrorHandling()
  console.log('')
  
  // 結果
  console.log('=' .repeat(60))
  console.log('📊 テスト結果まとめ:')
  console.log(`通常生成: ${normalResult ? '✅ 成功' : '❌ 失敗'}`)
  console.log(`ストリーミング: ${streamingResult ? '✅ 成功' : '❌ 失敗'}`)
  console.log(`エラーハンドリング: ${errorResult ? '✅ 成功' : '❌ 失敗'}`)
  
  if (normalResult && streamingResult && errorResult) {
    console.log('🎉 全テスト成功! /api/chat/generate エンドポイントが正常に動作しています。')
    process.exit(0)
  } else {
    console.log('⚠️  一部テストが失敗しました。詳細を確認してください。')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { testNormalGeneration, testStreamingGeneration, testErrorHandling }