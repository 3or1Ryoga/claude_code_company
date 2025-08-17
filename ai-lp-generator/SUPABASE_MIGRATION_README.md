# Supabase Database Migration Guide

## Overview
This migration adds user-scoped data management with strict RLS policies for the AI-LP Generator.

## Migration Files

### 1. `supabase-projects-table.sql`
- **Purpose**: Complete database schema with concepts and projects tables
- **Features**:
  - Concepts table for storing PASONA-based AI concepts
  - Extended projects table with user ownership
  - Strict RLS policies (users can only access their own data)
  - Performance indexes on all foreign keys

### 2. `supabase-migration-v2.sql`
- **Purpose**: Incremental migration for existing databases
- **Use Case**: Apply to databases that already have the original projects table
- **Safe**: Uses IF NOT EXISTS clauses to prevent errors

### 3. `supabase-rollback-v2.sql`
- **Purpose**: Rollback script to revert v2 changes
- **Use Case**: Emergency rollback if issues are detected

## Database Schema

### Concepts Table
```sql
concepts
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key → auth.users)
├── pasona_input (JSONB)
├── markdown_content (TEXT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### Projects Table (Extended)
```sql
projects
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key → auth.users) [NEW]
├── name (VARCHAR(255))
├── concept (VARCHAR(500))
├── description (TEXT)
├── code (TEXT)
├── dependencies (JSONB)
├── concept_id (UUID, Foreign Key → concepts) [NEW]
├── archive_url (TEXT) [NEW]
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

## RLS Policies

### Strict User Isolation
All tables enforce `auth.uid() = user_id` for all operations:
- SELECT: Users can only view their own records
- INSERT: Users can only create records with their user_id
- UPDATE: Users can only modify their own records
- DELETE: Users can only delete their own records

## Indexes for Performance
- `idx_concepts_user_id`: Fast user-specific queries
- `idx_concepts_created_at`: Temporal sorting
- `idx_projects_user_id`: User project filtering
- `idx_projects_concept_id`: Concept-project relationships
- `idx_projects_created_at`: Temporal sorting
- `idx_projects_name`: Name-based searches
- `idx_projects_concept`: Concept text searches

## Migration Steps

### For New Database
```bash
# Run the complete schema
psql -U postgres -d your_database -f supabase-projects-table.sql
```

### For Existing Database
```bash
# Apply incremental migration
psql -U postgres -d your_database -f supabase-migration-v2.sql
```

### Rollback (if needed)
```bash
# Revert to original schema
psql -U postgres -d your_database -f supabase-rollback-v2.sql
```

## Verification Queries

### Check Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('concepts', 'projects');
```

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('concepts', 'projects');
```

### Check Indexes
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('concepts', 'projects');
```

## Security Notes
- All data is strictly isolated by user_id
- No cross-user data access is possible
- Foreign key constraints ensure data integrity
- CASCADE deletes prevent orphaned records