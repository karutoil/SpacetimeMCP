/**
 * SpacetimeDB MCP Server
 * Universal MCP server for SpacetimeDB development
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { loadConfig, getConfigHelp } from './lib/config.js';
import { errorResponse, ToolResponse } from './lib/safe-json.js';

// Import all tools
import * as workspace from './tools/workspace.js';
import * as cli from './tools/cli.js';
import * as debug from './tools/debug.js';
import * as dev from './tools/dev.js';
import * as project from './tools/project.js';
import * as bindings from './tools/bindings.js';
import * as capabilities from './tools/capabilities.js';
import * as client from './tools/client.js';

// Configuration
const config = loadConfig();

// Tool registry
type ToolHandler = (args?: any) => Promise<any>;

const tools: Record<string, ToolHandler> = {
  // Workspace Intelligence
  'workspace.summary': workspace.workspace_summary,
  'workspace.search_code': workspace.workspace_search_code,
  'workspace.git_diff_summary': workspace.workspace_git_diff_summary,
  'workspace.detect_module_path': workspace.workspace_detect_module_path,
  'workspace.detect_bindings_path': workspace.workspace_detect_bindings_path,

  // SpacetimeDB CLI Operator
  'stdb.cli.status': cli.stdb_cli_status,
  'stdb.cli.start': cli.stdb_cli_start,
  'stdb.cli.publish': cli.stdb_cli_publish,
  'stdb.cli.generate_bindings': cli.stdb_cli_generate_bindings,
  'stdb.cli.logs_tail': cli.stdb_cli_logs_tail,
  'stdb.cli.logs_follow': cli.stdb_cli_logs_follow,

  // Debug Intelligence
  'stdb.debug.last_panic': debug.stdb_debug_last_panic,
  'stdb.debug.explain_error': debug.stdb_debug_explain_error,
  'stdb.debug.server_health': debug.stdb_debug_server_health,

  // Cargo / Build Tools
  'dev.cargo.check': dev.dev_cargo_check,
  'dev.cargo.test': dev.dev_cargo_test,

  // Project Structure
  'stdb.project.describe': project.stdb_project_describe,
  'stdb.project.agent_context': project.stdb_project_agent_context,

  // Bindings
  'stdb.bindings.inspect': bindings.stdb_bindings_inspect,

  // Capabilities
  'stdb.capabilities': capabilities.stdb_capabilities,

  // Client (optional, requires permission)
  'stdb.client.connect': client.stdb_client_connect,
  'stdb.client.subscribe': client.stdb_client_subscribe,
  'stdb.client.reducer.call': client.stdb_client_reducer_call
};

// Tool definitions for MCP
const toolDefinitions = [
  // Workspace Intelligence
  {
    name: 'workspace.summary',
    description: 'Get workspace summary including project structure, key files, and subdirectories',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'workspace.search_code',
    description: 'Search for code patterns in Rust source files',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Search pattern (regex or text)' }
      },
      required: ['pattern']
    }
  },
  {
    name: 'workspace.git_diff_summary',
    description: 'Get git diff summary showing modified files',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'workspace.detect_module_path',
    description: 'Detect the module source file (lib.rs or main.rs)',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'workspace.detect_bindings_path',
    description: 'Detect the generated module bindings path',
    inputSchema: { type: 'object', properties: {} }
  },

  // SpacetimeDB CLI
  {
    name: 'stdb.cli.status',
    description: 'Check SpacetimeDB CLI status and installed modules',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'stdb.cli.start',
    description: 'Start a SpacetimeDB server',
    inputSchema: {
      type: 'object',
      properties: {
        dbName: { type: 'string', description: 'Database name' }
      }
    }
  },
  {
    name: 'stdb.cli.publish',
    description: 'Publish a SpacetimeDB module',
    inputSchema: {
      type: 'object',
      properties: {
        modulePath: { type: 'string', description: 'Path to module source' }
      }
    }
  },
  {
    name: 'stdb.cli.generate_bindings',
    description: 'Generate client bindings',
    inputSchema: {
      type: 'object',
      properties: {
        modulePath: { type: 'string', description: 'Path to module source' }
      }
    }
  },
  {
    name: 'stdb.cli.logs_tail',
    description: 'Tail recent log entries',
    inputSchema: {
      type: 'object',
      properties: {
        dbName: { type: 'string', description: 'Database name' },
        lines: { type: 'number', description: 'Number of lines (default: 100)' }
      }
    }
  },
  {
    name: 'stdb.cli.logs_follow',
    description: 'Start following logs (returns command to run)',
    inputSchema: {
      type: 'object',
      properties: {
        dbName: { type: 'string', description: 'Database name' }
      }
    }
  },

  // Debug
  {
    name: 'stdb.debug.last_panic',
    description: 'Get the last panic from logs with suggestions',
    inputSchema: {
      type: 'object',
      properties: {
        dbName: { type: 'string', description: 'Database name' },
        lines: { type: 'number', description: 'Lines to search (default: 200)' }
      }
    }
  },
  {
    name: 'stdb.debug.explain_error',
    description: 'Explain an error or panic with suggestions',
    inputSchema: {
      type: 'object',
      properties: {
        errorText: { type: 'string', description: 'Error text to analyze' }
      },
      required: ['errorText']
    }
  },
  {
    name: 'stdb.debug.server_health',
    description: 'Check if the SpacetimeDB server is healthy',
    inputSchema: {
      type: 'object',
      properties: {
        dbName: { type: 'string', description: 'Database name' }
      }
    }
  },

  // Cargo
  {
    name: 'dev.cargo.check',
    description: 'Run cargo check to find compilation errors',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'dev.cargo.test',
    description: 'Run cargo test',
    inputSchema: { type: 'object', properties: {} }
  },

  // Project
  {
    name: 'stdb.project.describe',
    description: 'Extract and describe the SpacetimeDB module schema (tables, reducers, views)',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'stdb.project.agent_context',
    description: 'Generate a knowledge bundle for AI agents about this project',
    inputSchema: { type: 'object', properties: {} }
  },

  // Bindings
  {
    name: 'stdb.bindings.inspect',
    description: 'Inspect generated client bindings',
    inputSchema: { type: 'object', properties: {} }
  },

  // Capabilities
  {
    name: 'stdb.capabilities',
    description: 'Detect runtime capabilities and requirements',
    inputSchema: { type: 'object', properties: {} }
  },

  // Client (requires write permission)
  {
    name: 'stdb.client.connect',
    description: 'Get guidance for connecting to SpacetimeDB (requires STDB_MCP_ALLOW_WRITE=1)',
    inputSchema: {
      type: 'object',
      properties: {
        uri: { type: 'string', description: 'Server URI' }
      }
    }
  },
  {
    name: 'stdb.client.subscribe',
    description: 'Get guidance for subscriptions (requires STDB_MCP_ALLOW_WRITE=1)',
    inputSchema: {
      type: 'object',
      properties: {
        subscription: { type: 'string', description: 'SQL subscription query' }
      },
      required: ['subscription']
    }
  },
  {
    name: 'stdb.client.reducer.call',
    description: 'Get guidance for calling a reducer (requires STDB_MCP_ALLOW_WRITE=1)',
    inputSchema: {
      type: 'object',
      properties: {
        reducerName: { type: 'string', description: 'Name of the reducer' },
        args: { type: 'object', description: 'Reducer arguments' }
      },
      required: ['reducerName']
    }
  }
];

// Create MCP server
class SpacetimeDBServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'spacetimedb-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: toolDefinitions };
    });

    // Call tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request): Promise<any> => {
      const { name, arguments: args } = request.params;
      const handler = tools[name];

      if (!handler) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(errorResponse(
              'TOOL_NOT_FOUND',
              `Tool '${name}' not found`,
              { available_tools: Object.keys(tools) },
              [],
              0
            ))
          }]
        };
      }

      try {
        const result = await handler(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result)
          }]
        };
      } catch (err: any) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(errorResponse(
              'TOOL_ERROR',
              err.message || 'Tool execution failed',
              { tool: name, stack: err.stack },
              [],
              0
            ))
          }]
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SpacetimeDB MCP Server running...');
  }
}

// Main
const server = new SpacetimeDBServer();
server.run().catch((err) => {
  console.error('Server error:', err);
  process.exit(1);
});
