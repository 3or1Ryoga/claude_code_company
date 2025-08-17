#!/usr/bin/env node

const { exec } = require('child_process')
const { promisify } = require('util')
const http = require('http')

const execAsync = promisify(exec)

class ServerHealthCheck {
  constructor() {
    this.defaultPorts = [3000, 3001, 3002, 3003, 3004, 3005]
  }

  async checkPort(port) {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/',
        method: 'GET',
        timeout: 3000
      }, (res) => {
        resolve({
          port,
          status: 'active',
          statusCode: res.statusCode,
          responding: true
        })
      })

      req.on('error', () => {
        resolve({
          port,
          status: 'inactive',
          statusCode: null,
          responding: false
        })
      })

      req.on('timeout', () => {
        req.destroy()
        resolve({
          port,
          status: 'timeout',
          statusCode: null,
          responding: false
        })
      })

      req.end()
    })
  }

  async getProcessInfo(port) {
    try {
      const { stdout } = await execAsync(`lsof -i :${port}`)
      const lines = stdout.trim().split('\n')
      
      if (lines.length > 1) {
        const processLine = lines[1]
        const parts = processLine.split(/\s+/)
        
        return {
          port,
          hasProcess: true,
          pid: parseInt(parts[1]),
          processName: parts[0],
          command: parts.slice(8).join(' ')
        }
      }
    } catch {
      // ポートが使用されていない
    }
    
    return {
      port,
      hasProcess: false,
      pid: null,
      processName: null,
      command: null
    }
  }

  async generateReport() {
    console.log('=== サーバー状況レポート ===\n')
    
    let activeServers = 0
    
    for (const port of this.defaultPorts) {
      const processInfo = await this.getProcessInfo(port)
      const healthCheck = await this.checkPort(port)
      
      const status = healthCheck.responding ? '✅ アクティブ' : 
                    processInfo.hasProcess ? '⚠️  プロセス存在(応答なし)' : 
                    '❌ 非アクティブ'
      
      console.log(`ポート ${port}: ${status}`)
      
      if (processInfo.hasProcess) {
        console.log(`  └─ PID: ${processInfo.pid}, プロセス: ${processInfo.processName}`)
        if (healthCheck.responding) activeServers++
      }
      
      if (healthCheck.responding) {
        console.log(`  └─ HTTP応答: ${healthCheck.statusCode}`)
      }
      
      console.log('')
    }
    
    console.log('=== サマリー ===')
    console.log(`アクティブサーバー: ${activeServers}`)
    console.log(`推奨運用ポート: 3001`)
    
    // 推奨アクション
    if (activeServers === 0) {
      console.log('\n📝 推奨アクション: サーバーを起動してください')
      console.log('   npm run dev:3001')
    } else if (activeServers > 1) {
      console.log('\n📝 推奨アクション: 不要なサーバーを停止してください')
      console.log('   npm run server:kill')
    } else {
      console.log('\n✅ システム状況: 正常')
    }
  }
}

async function main() {
  const checker = new ServerHealthCheck()
  await checker.generateReport()
}

// スクリプトが直接実行された場合
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { ServerHealthCheck }