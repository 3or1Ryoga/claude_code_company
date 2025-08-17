#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

class DatabaseMigrator {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase configuration. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey)
    this.migrationsDir = path.join(process.cwd())
  }

  async checkConnection() {
    try {
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1)
      
      if (error) throw error
      
      console.log('✅ Database connection successful')
      return true
    } catch (error) {
      console.error('❌ Database connection failed:', error.message)
      return false
    }
  }

  async getCurrentVersion() {
    try {
      // Try to get the current migration version
      const { data, error } = await this.supabase
        .from('schema_migrations')
        .select('version')
        .order('version', { ascending: false })
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      return data?.version || '0'
    } catch (error) {
      // If schema_migrations table doesn't exist, we're at version 0
      console.log('📝 No migrations table found, starting from version 0')
      return '0'
    }
  }

  async createMigrationsTable() {
    console.log('📋 Creating migrations tracking table...')
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    const { error } = await this.supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (error) {
      console.error('❌ Failed to create migrations table:', error.message)
      throw error
    }
    
    console.log('✅ Migrations table ready')
  }

  async runMigration(filename) {
    console.log(`📦 Running migration: ${filename}`)
    
    try {
      const filePath = path.join(this.migrationsDir, filename)
      const sql = await fs.readFile(filePath, 'utf8')
      
      // Execute the migration SQL
      const { error } = await this.supabase.rpc('exec_sql', { sql })
      
      if (error) {
        throw error
      }
      
      // Record the migration as applied
      const version = filename.replace('.sql', '')
      const { error: insertError } = await this.supabase
        .from('schema_migrations')
        .insert({ version })
      
      if (insertError) {
        throw insertError
      }
      
      console.log(`✅ Migration ${filename} completed successfully`)
      return true
      
    } catch (error) {
      console.error(`❌ Migration ${filename} failed:`, error.message)
      throw error
    }
  }

  async findMigrationFiles() {
    const migrationFiles = [
      'supabase-projects-table.sql',
      'database-schema-update.sql'
    ]
    
    const existingFiles = []
    
    for (const file of migrationFiles) {
      try {
        await fs.access(path.join(this.migrationsDir, file))
        existingFiles.push(file)
      } catch {
        console.warn(`⚠️  Migration file not found: ${file}`)
      }
    }
    
    return existingFiles
  }

  async migrate() {
    console.log('🔄 Starting database migration...')
    
    if (!(await this.checkConnection())) {
      throw new Error('Cannot connect to database')
    }
    
    await this.createMigrationsTable()
    
    const currentVersion = await this.getCurrentVersion()
    console.log(`📍 Current migration version: ${currentVersion}`)
    
    const migrationFiles = await this.findMigrationFiles()
    
    if (migrationFiles.length === 0) {
      console.log('✅ No migration files found')
      return
    }
    
    console.log(`📁 Found ${migrationFiles.length} migration file(s)`)
    
    for (const file of migrationFiles) {
      const version = file.replace('.sql', '')
      
      // Check if this migration has already been applied
      const { data: existing } = await this.supabase
        .from('schema_migrations')
        .select('version')
        .eq('version', version)
        .single()
      
      if (existing) {
        console.log(`⏭️  Skipping already applied migration: ${file}`)
        continue
      }
      
      await this.runMigration(file)
    }
    
    console.log('🎉 All migrations completed successfully!')
  }

  async rollback(version) {
    console.log(`🔄 Rolling back to version: ${version}`)
    
    // This is a simplified rollback - in production you'd want proper rollback scripts
    const { error } = await this.supabase
      .from('schema_migrations')
      .delete()
      .gte('version', version)
    
    if (error) {
      console.error('❌ Rollback failed:', error.message)
      throw error
    }
    
    console.log('✅ Rollback completed')
  }

  async status() {
    console.log('📊 Migration Status')
    console.log('==================')
    
    if (!(await this.checkConnection())) {
      return
    }
    
    const currentVersion = await this.getCurrentVersion()
    console.log(`Current Version: ${currentVersion}`)
    
    // List applied migrations
    const { data: migrations } = await this.supabase
      .from('schema_migrations')
      .select('version, applied_at')
      .order('version', { ascending: true })
    
    if (migrations && migrations.length > 0) {
      console.log('\nApplied Migrations:')
      migrations.forEach(migration => {
        console.log(`  ✅ ${migration.version} (${new Date(migration.applied_at).toLocaleString()})`)
      })
    } else {
      console.log('\nNo migrations applied yet')
    }
    
    // List pending migrations
    const migrationFiles = await this.findMigrationFiles()
    const appliedVersions = migrations?.map(m => m.version) || []
    const pendingFiles = migrationFiles.filter(file => 
      !appliedVersions.includes(file.replace('.sql', ''))
    )
    
    if (pendingFiles.length > 0) {
      console.log('\nPending Migrations:')
      pendingFiles.forEach(file => {
        console.log(`  ⏳ ${file}`)
      })
    } else {
      console.log('\nNo pending migrations')
    }
  }
}

async function main() {
  const migrator = new DatabaseMigrator()
  const command = process.argv[2] || 'migrate'
  
  try {
    switch (command) {
      case 'migrate':
      case 'up':
        await migrator.migrate()
        break
        
      case 'status':
        await migrator.status()
        break
        
      case 'rollback':
        const version = process.argv[3]
        if (!version) {
          console.error('❌ Please specify a version to rollback to')
          process.exit(1)
        }
        await migrator.rollback(version)
        break
        
      case 'check':
        const connected = await migrator.checkConnection()
        process.exit(connected ? 0 : 1)
        break
        
      default:
        console.log(`
Usage: node scripts/db-migrate.js [command]

Commands:
  migrate, up    Run pending migrations (default)
  status         Show migration status
  rollback VER   Rollback to specified version
  check          Check database connection

Examples:
  npm run db:migrate
  npm run db:migrate status
  npm run db:migrate rollback 001
        `)
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)