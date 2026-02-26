/**
 * Client Bindings Inspection Tool
 */

import * as fs from 'fs';
import { loadConfig, detectProjectStructure } from '../lib/config.js';
import { successResponse, errorResponse, ToolResponse } from '../lib/safe-json.js';

const config = loadConfig();

/**
 * Inspect generated bindings
 */
export async function stdb_bindings_inspect(): Promise<ToolResponse> {
  const startTime = Date.now();

  try {
    const projectRoot = config.projectRoot;
    const structure = await detectProjectStructure(projectRoot);
    const bindingsPath = structure.bindingsPath || config.bindingsPath;

    if (!bindingsPath || !fs.existsSync(bindingsPath)) {
      return errorResponse(
        'BINDINGS_NOT_FOUND',
        'Could not find module bindings',
        { searched: bindingsPath },
        ['stdb.cli.generate_bindings', 'workspace.detect_bindings_path'],
        Date.now() - startTime
      );
    }

    const content = fs.readFileSync(bindingsPath, 'utf-8');

    // Extract information from bindings
    const tables = extractTables(content);
    const reducers = extractReducers(content);
    const connectionBuilder = extractConnectionBuilder(content);

    return successResponse({
      bindings_path: bindingsPath,
      tables,
      reducers,
      connection_builder: connectionBuilder,
      node_importable: content.includes('module.exports') || content.includes('export'),
      raw_snippet: content.substring(0, 2000)
    }, Date.now() - startTime);
  } catch (err: any) {
    return errorResponse(
      'BINDINGS_ERROR',
      err.message || 'Failed to inspect bindings',
      null,
      [],
      Date.now() - startTime
    );
  }
}

/**
 * Extract table information from bindings
 */
function extractTables(content: string): { name: string; type: string }[] {
  const tables: { name: string; type: string }[] = [];

  // Match table type definitions: export const PlayerTable = ...
  const pattern = /export\s+const\s+(\w+Table)\s*=/g;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    tables.push({
      name: match[1].replace('Table', ''),
      type: match[1]
    });
  }

  return tables;
}

/**
 * Extract reducer methods from bindings
 */
function extractReducers(content: string): { name: string; client_name: string; params: string }[] {
  const reducers: { name: string; client_name: string; params: string }[] = [];

  // Match reducer calls: export const insertPlayer = (client, ...) => ...
  // or static methods: static insertPlayer(...)
  const patterns = [
    /export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(?.*?\)?\s*=>/g,
    /\.(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1];
      // Filter to likely reducers (camelCase, not starting with uppercase)
      if (/^[a-z][a-zA-Z]*$/.test(name) && !name.includes('Table')) {
        if (!reducers.find(r => r.name === name)) {
          reducers.push({
            name,
            client_name: name,
            params: '...'
          });
        }
      }
    }
  }

  return reducers;
}

/**
 * Extract connection builder hints
 */
function extractConnectionBuilder(content: string): { method: string; uri?: string } | null {
  // Look for connection patterns
  if (content.includes('DbConnection') || content.includes('connect')) {
    return {
      method: 'DbConnection.connect() or builder pattern'
    };
  }

  if (content.includes('Identity')) {
    return {
      method: 'Identity-based connection'
    };
  }

  return {
    method: 'Unknown'
  };
}
