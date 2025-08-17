#!/usr/bin/env node

const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

class PortKiller {
  constructor() {
    this.defaultPort = process.env.PORT || 3001
  }

  async getProcessesOnPort(port) {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`)
      return stdout.trim().split('\n').filter(Boolean)
    } catch {
      return []
    }
  }

  async getProcessInfo(pid) {
    try {
      const { stdout } = await execAsync(`ps -p ${pid} -o pid,ppid,command --no-headers`)
      return stdout.trim()
    } catch {
      return `PID ${pid} (process info unavailable)`
    }
  }

  async killProcess(pid, signal = 'TERM') {
    try {
      await execAsync(`kill -${signal} ${pid}`)
      return true
    } catch {
      return false
    }
  }

  async forceKillProcess(pid) {
    try {
      await execAsync(`kill -9 ${pid}`)
      return true
    } catch {
      return false
    }
  }

  async killPortProcesses(port, options = {}) {
    const { force = false, verbose = true } = options
    
    console.log(`🔍 Checking port ${port}...`)
    
    const pids = await this.getProcessesOnPort(port)
    
    if (pids.length === 0) {
      console.log(`✅ Port ${port} is already free`)
      return true
    }

    console.log(`🎯 Found ${pids.length} process(es) on port ${port}`)
    
    for (const pid of pids) {
      if (verbose) {
        const processInfo = await this.getProcessInfo(pid)
        console.log(`📍 Process: ${processInfo}`)
      }

      let killed = false
      
      if (!force) {
        // Try graceful termination first
        console.log(`🤝 Attempting graceful termination of PID ${pid}...`)
        killed = await this.killProcess(pid, 'TERM')
        
        if (killed) {
          // Wait a moment and check if process is still running
          await new Promise(resolve => setTimeout(resolve, 1000))
          const stillRunning = await this.getProcessesOnPort(port)
          killed = !stillRunning.includes(pid)
        }
      }
      
      if (!killed) {
        // Force kill if graceful termination failed
        console.log(`💥 Force killing PID ${pid}...`)
        killed = await this.forceKillProcess(pid)
      }
      
      if (killed) {
        console.log(`✅ Successfully terminated PID ${pid}`)
      } else {
        console.log(`❌ Failed to terminate PID ${pid}`)
      }
    }

    // Verify port is free
    await new Promise(resolve => setTimeout(resolve, 1000))
    const remainingPids = await this.getProcessesOnPort(port)
    
    if (remainingPids.length === 0) {
      console.log(`🎉 Port ${port} is now free`)
      return true
    } else {
      console.log(`⚠️  Port ${port} still has ${remainingPids.length} running process(es)`)
      return false
    }
  }

  async killPortRange(startPort, endPort, options = {}) {
    const results = []
    
    for (let port = startPort; port <= endPort; port++) {
      console.log(`\n🔄 Processing port ${port}...`)
      const success = await this.killPortProcesses(port, options)
      results.push({ port, success })
    }
    
    return results
  }
}

async function main() {
  const killer = new PortKiller()
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    // Kill default port
    await killer.killPortProcesses(killer.defaultPort, { verbose: true })
    return
  }

  const command = args[0]

  switch (command) {
    case 'port':
      const port = parseInt(args[1]) || killer.defaultPort
      const force = args.includes('--force') || args.includes('-f')
      await killer.killPortProcesses(port, { force, verbose: true })
      break

    case 'range':
      const startPort = parseInt(args[1]) || 3001
      const endPort = parseInt(args[2]) || 3010
      const forceRange = args.includes('--force') || args.includes('-f')
      const results = await killer.killPortRange(startPort, endPort, { force: forceRange, verbose: true })
      
      console.log('\n📊 Summary:')
      results.forEach(({ port, success }) => {
        console.log(`   Port ${port}: ${success ? '✅ Freed' : '❌ Failed'}`)
      })
      break

    case 'dev-ports':
      // Kill common development ports
      const devPorts = [3000, 3001, 3002, 3003, 8000, 8080, 5000, 5173]
      console.log('🧹 Cleaning up common development ports...')
      
      for (const devPort of devPorts) {
        const pids = await killer.getProcessesOnPort(devPort)
        if (pids.length > 0) {
          await killer.killPortProcesses(devPort, { verbose: false })
        }
      }
      break

    case 'help':
    default:
      console.log(`
Usage: node scripts/kill-port.js [command] [options]

Commands:
  (no args)           Kill processes on default port (${killer.defaultPort})
  port <port> [-f]    Kill processes on specific port
  range <start> <end> [-f]  Kill processes on port range
  dev-ports           Kill processes on common dev ports
  help                Show this help

Options:
  -f, --force         Force kill (skip graceful termination)

Examples:
  npm run server:kill
  npm run server:kill port 3001
  npm run server:kill port 3002 --force
  npm run server:kill range 3001 3010
  npm run server:kill dev-ports
      `)
  }
}

main().catch(console.error)