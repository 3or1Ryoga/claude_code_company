import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { dbOperations } from './lib/supabase.js';
import { generateNextProject } from './lib/project-generator.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class V0CodeGeneratorMCP {
  constructor() {
    this.server = new Server(
      {
        name: 'v0-code-generator-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  setupToolHandlers() {
    // Generate Project Tool
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'generateProject': {
          try {
            const { projectName, projectType, features = [] } = args;
            
            // Generate the project
            const projectPath = await generateNextProject({
              name: projectName,
              type: projectType,
              features: features,
              outputDir: path.join(__dirname, 'generated_projects')
            });

            // Save to Supabase
            const projectData = {
              name: projectName,
              type: projectType,
              features: features,
              path: projectPath,
              created_at: new Date().toISOString()
            };

            if (dbOperations.createProject) {
              await dbOperations.createProject(projectData);
            }

            return {
              content: [
                {
                  type: 'text',
                  text: `Project "${projectName}" generated successfully at ${projectPath}`
                }
              ]
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error generating project: ${error.message}`
                }
              ],
              isError: true
            };
          }
        }

        case 'saveToSupabase': {
          try {
            const { projectData } = args;
            const result = await dbOperations.createProject(projectData);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Project saved to Supabase with ID: ${result.id}`
                }
              ]
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error saving to Supabase: ${error.message}`
                }
              ],
              isError: true
            };
          }
        }

        case 'getProjectHistory': {
          try {
            const { limit = 10 } = args;
            const projects = await dbOperations.getProjects();
            const limitedProjects = projects.slice(0, limit);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(limitedProjects, null, 2)
                }
              ]
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error retrieving projects: ${error.message}`
                }
              ],
              isError: true
            };
          }
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // List available tools
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'generateProject',
            description: 'Generate a new Next.js project using v0 patterns',
            inputSchema: {
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'Name of the project'
                },
                projectType: {
                  type: 'string',
                  enum: ['portfolio', 'ecommerce', 'blog', 'dashboard', 'landing-page'],
                  description: 'Type of project'
                },
                features: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Features to include'
                }
              },
              required: ['projectName', 'projectType']
            }
          },
          {
            name: 'saveToSupabase',
            description: 'Save project metadata to Supabase',
            inputSchema: {
              type: 'object',
              properties: {
                projectData: {
                  type: 'object',
                  description: 'Project data to save'
                }
              },
              required: ['projectData']
            }
          },
          {
            name: 'getProjectHistory',
            description: 'Get project generation history',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of projects to retrieve'
                }
              }
            }
          }
        ]
      };
    });
  }

  setupResourceHandlers() {
    // Read resource handler
    this.server.setRequestHandler('resources/read', async (request) => {
      const { uri } = request.params;
      
      if (uri.startsWith('file://./templates')) {
        const templatePath = uri.replace('file://./templates', path.join(__dirname, 'templates'));
        try {
          const content = await fs.readFile(templatePath, 'utf-8');
          return {
            contents: [
              {
                uri,
                mimeType: 'text/plain',
                text: content
              }
            ]
          };
        } catch (error) {
          throw new Error(`Failed to read template: ${error.message}`);
        }
      }
      
      if (uri.startsWith('file://./generated_projects')) {
        const projectPath = uri.replace('file://./generated_projects', path.join(__dirname, 'generated_projects'));
        try {
          const stats = await fs.stat(projectPath);
          if (stats.isDirectory()) {
            const files = await fs.readdir(projectPath);
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(files, null, 2)
                }
              ]
            };
          } else {
            const content = await fs.readFile(projectPath, 'utf-8');
            return {
              contents: [
                {
                  uri,
                  mimeType: 'text/plain',
                  text: content
                }
              ]
            };
          }
        } catch (error) {
          throw new Error(`Failed to read project: ${error.message}`);
        }
      }
      
      throw new Error(`Unknown resource URI: ${uri}`);
    });

    // List resources handler
    this.server.setRequestHandler('resources/list', async () => {
      return {
        resources: [
          {
            uri: 'file://./templates',
            name: 'templates',
            description: 'Project templates',
            mimeType: 'text/directory'
          },
          {
            uri: 'file://./generated_projects',
            name: 'generated_projects',
            description: 'Generated projects directory',
            mimeType: 'text/directory'
          }
        ]
      };
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('V0 Code Generator MCP Server started');
  }
}

// Start the server
const mcpServer = new V0CodeGeneratorMCP();
mcpServer.start().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});