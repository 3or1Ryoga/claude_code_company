#!/usr/bin/env node

import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

class AutoDevServer {
  constructor() {
    this.preferredPort = process.env.PORT || 3001
    this.portRange = {
      start: parseInt(process.env.DEV_PORT_RANGE_START) || 3001,
      end: parseInt(process.env.DEV_PORT_RANGE_END) || 3010
    }
    this.autoPortDetection = process.env.AUTO_PORT_DETECTION === 'true'
    this.logFile = path.join(process.cwd(), 'logs', 'dev-server.log')
  }

  async checkPortAvailable(port) {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`)
      return stdout.trim() === ''
    } catch {
      return true // Port is available if lsof fails
    }
  }

  async findAvailablePort() {
    // First, try the preferred port
    if (await this.checkPortAvailable(this.preferredPort)) {
      return this.preferredPort
    }

    if (!this.autoPortDetection) {
      throw new Error(`Preferred port ${this.preferredPort} is in use and auto-detection is disabled`)
    }

    // Search for available port in range
    for (let port = this.portRange.start; port <= this.portRange.end; port++) {
      if (await this.checkPortAvailable(port)) {
        console.log(`🔄 Port ${this.preferredPort} is busy, using port ${port}`)
        return port
      }
    }

    throw new Error(`No available ports found in range ${this.portRange.start}-${this.portRange.end}`)
  }

  async killExistingServers() {
    console.log('🧹 Cleaning up existing development servers...')
    
    for (let port = this.portRange.start; port <= this.portRange.end; port++) {
      try {
        const { stdout } = await execAsync(`lsof -ti:${port}`)
        const pids = stdout.trim().split('\n').filter(Boolean)
        
        for (const pid of pids) {
          try {
            // Check if it's a Next.js process
            const { stdout: processInfo } = await execAsync(`ps -p ${pid} -o command --no-headers`)
            if (processInfo.includes('next') || processInfo.includes('dev')) {
              console.log(`🔪 Killing Next.js process on port ${port} (PID: ${pid})`)
              await execAsync(`kill -TERM ${pid}`)
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              // Force kill if still running
              try {
                await execAsync(`kill -0 ${pid}`)
                await execAsync(`kill -9 ${pid}`)
              } catch {
                // Process already terminated
              }
            }
          } catch (error) {
            console.warn(`Could not analyze process ${pid}:`, error.message)
          }
        }
      } catch {
        // No processes on this port
      }
    }
  }

  async setupLogging() {
    try {
      await fs.mkdir(path.dirname(this.logFile), { recursive: true })
    } catch (error) {
      console.warn('Could not create logs directory:', error.message)
    }
  }

  async logEvent(event, data = {}) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        ...data
      }
      
      await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n')
    } catch (error) {
      console.warn('Could not write to log file:', error.message)
    }
  }

  async checkDependencies() {
    console.log('🔍 Checking dependencies...')
    
    try {
      // Check if node_modules exists
      await fs.access(path.join(process.cwd(), 'node_modules'))
    } catch {
      console.log('📦 Installing dependencies...')
      await execAsync('npm install')
    }

    // Check for Next.js
    try {
      await execAsync('npx next --version')
      console.log('✅ Next.js is available')
    } catch {
      throw new Error('Next.js is not installed. Run npm install first.')
    }
  }

  async startServer(port) {
    console.log(`🚀 Starting development server on port ${port}...`)
    
    await this.logEvent('server_starting', { port })

    // Update environment variables
    process.env.PORT = port.toString()
    process.env.NEXT_PUBLIC_APP_URL = `http://localhost:${port}`

    // Start Next.js development server
    const child = spawn('npx', ['next', 'dev', '-p', port.toString()], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: process.env
    })

    let serverReady = false

    // Handle stdout
    child.stdout.on('data', (data) => {
      const output = data.toString()
      console.log(output)
      
      // Log to file
      this.logEvent('server_output', { output: output.trim() })
      
      // Check if server is ready
      if (output.includes('ready') && output.includes('localhost')) {
        serverReady = true
        this.logEvent('server_ready', { port })
        console.log(`🎉 Development server is ready at http://localhost:${port}`)
      }
    })

    // Handle stderr
    child.stderr.on('data', (data) => {
      const error = data.toString()
      console.error(`🚨 ${error}`)
      this.logEvent('server_error', { error: error.trim() })
    })

    // Handle process exit
    child.on('exit', (code) => {
      this.logEvent('server_exit', { code, port })
      if (code !== 0) {
        console.error(`❌ Server exited with code ${code}`)
      } else {
        console.log(`✅ Server stopped gracefully`)
      }
    })

    // Handle process errors
    child.on('error', (error) => {
      this.logEvent('server_start_error', { error: error.message, port })
      console.error(`❌ Failed to start server:`, error.message)
    })

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Gracefully shutting down...')
      child.kill('SIGTERM')
      setTimeout(() => {
        child.kill('SIGKILL')
        process.exit(0)
      }, 5000)
    })

    process.on('SIGTERM', () => {
      child.kill('SIGTERM')
    })

    return child
  }

  async createHealthEndpoint(port) {
    // This would ideally be handled by the Next.js app itself
    // but we can create a simple health check endpoint here if needed
    console.log(`💚 Health check available at http://localhost:${port}/api/health`)
  }

  async run() {
    try {
      console.log('🔧 Starting automated development server...')
      
      await this.setupLogging()
      await this.logEvent('auto_dev_start')
      
      // Optional: Kill existing servers
      if (process.argv.includes('--clean')) {
        await this.killExistingServers()
      }
      
      await this.checkDependencies()
      
      const port = await this.findAvailablePort()
      
      await this.createHealthEndpoint(port)
      
      const serverProcess = await this.startServer(port)
      
      // Keep the process alive
      return new Promise((resolve, reject) => {
        serverProcess.on('exit', resolve)
        serverProcess.on('error', reject)
      })
      
    } catch (error) {
      console.error('❌ Failed to start development server:', error.message)
      await this.logEvent('auto_dev_error', { error: error.message })
      process.exit(1)
    }
  }
}

async function main() {
  const server = new AutoDevServer()
  
  // Parse command line arguments
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node scripts/start-dev.js [options]

Options:
  --clean     Kill existing development servers before starting
  --port PORT Set preferred port (overrides PORT env var)
  --help      Show this help message

Environment Variables:
  PORT                  Preferred port (default: 3001)
  DEV_PORT_RANGE_START  Start of port search range (default: 3001)
  DEV_PORT_RANGE_END    End of port search range (default: 3010)
  AUTO_PORT_DETECTION   Enable automatic port detection (default: true)

Examples:
  npm run dev:auto
  npm run dev:auto -- --clean
  PORT=3002 npm run dev:auto
    `)
    process.exit(0)
  }

  // Override port if specified
  if (args.includes('--port')) {
    const portIndex = args.indexOf('--port')
    const portValue = args[portIndex + 1]
    if (portValue && !isNaN(parseInt(portValue))) {
      process.env.PORT = portValue
    }
  }

  await server.run()
}

main().catch(console.error)