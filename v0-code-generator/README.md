# V0 Code Generator with Supabase & MCP Integration

## Overview
This project is a Next.js code generator that integrates with Supabase for data persistence and uses the Model Context Protocol (MCP) for AI-powered interactions.

## Setup

### 1. Environment Variables
Create a `.env` file with your Supabase credentials:

```
SUPABASE_URL=https://cisjwiegbvydbbjwpthz.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
```

### 2. Supabase Database Setup
Run the following SQL in your Supabase dashboard to create the projects table:

```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
CREATE POLICY "Allow all operations" ON projects
  FOR ALL USING (true);
```

### 3. Install Dependencies
```bash
npm install
```

## Usage

### Generate a Project
```bash
node index.js
```

### Start MCP Server
```bash
npm run mcp:start
```

## MCP Tools Available

1. **generateProject** - Generate a new Next.js project
   - Parameters: projectName, projectType, features
   - Types: portfolio, ecommerce, blog, dashboard, landing-page

2. **saveToSupabase** - Save project metadata to Supabase
   - Parameters: projectData

3. **getProjectHistory** - Retrieve project generation history
   - Parameters: limit (optional)

## Project Structure

```
v0-code-generator/
├── lib/
│   ├── supabase.js        # Supabase client and database operations
│   └── project-generator.js # Next.js project generation logic
├── generated_projects/     # Output directory for generated projects
├── mcp-server.js          # MCP server implementation
├── mcp.config.json        # MCP configuration
├── index.js               # Main entry point
└── .env                   # Environment variables
```

## Features

- **Project Types**: Portfolio, E-commerce, Blog, Dashboard, Landing Page
- **Optional Features**: Supabase integration, Authentication, Database schema
- **Supabase Integration**: Automatic project metadata storage
- **MCP Protocol**: AI-powered project generation and management

## Database Schema

Projects are stored in Supabase with the following structure:
- `id`: Unique identifier
- `name`: Project name
- `type`: Project type (portfolio, ecommerce, etc.)
- `features`: Array of enabled features
- `path`: Local file system path
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp