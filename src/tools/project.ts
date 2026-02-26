/**
 * SpacetimeDB Project Tools
 */

import * as fs from 'fs';
import * as path from 'path';
import { SchemaExtractor, ModuleSchema } from '../lib/schema-extractor.js';
import { loadConfig, detectProjectStructure } from '../lib/config.js';
import { successResponse, errorResponse, ToolResponse } from '../lib/safe-json.js';

const config = loadConfig();

/**
 * Describe the project schema
 */
export async function stdb_project_describe(): Promise<ToolResponse> {
  const startTime = Date.now();

  try {
    const projectRoot = config.projectRoot;
    const modulePath = config.modulePath ||
      (await detectProjectStructure(projectRoot)).modulePath;

    if (!modulePath || !fs.existsSync(modulePath)) {
      return errorResponse(
        'MODULE_NOT_FOUND',
        'Could not find module source',
        { searched: modulePath },
        ['workspace.detect_module_path'],
        Date.now() - startTime
      );
    }

    // Extract schema
    const schema = await SchemaExtractor.extract(path.dirname(modulePath));

    return successResponse({
      module_path: modulePath,
      schema,
      summary: SchemaExtractor.getSummary(schema)
    }, Date.now() - startTime);
  } catch (err: any) {
    return errorResponse(
      'DESCRIBE_ERROR',
      err.message || 'Failed to describe project',
      null,
      [],
      Date.now() - startTime
    );
  }
}

/**
 * Generate agent context
 */
export async function stdb_project_agent_context(): Promise<ToolResponse> {
  const startTime = Date.now();

  try {
    const projectRoot = config.projectRoot;
    const structure = await detectProjectStructure(projectRoot);
    const modulePath = structure.modulePath || config.modulePath;

    let schema: ModuleSchema | null = null;
    if (modulePath) {
      try {
        schema = await SchemaExtractor.extract(path.dirname(modulePath));
      } catch {
        // Ignore schema extraction errors
      }
    }

    const context = {
      module_path: modulePath,
      db_name: structure.dbName || config.dbName,
      bindings_path: structure.bindingsPath,
      project_root: projectRoot,

      // Key information for agents
      reducer_rules: {
        no_return_data: 'Reducers cannot return data. Use tables or subscriptions.',
        deterministic: 'Reducers must be deterministic - same input = same output.',
        bigint_ids: 'IDs are BigInt. Use "123n" syntax in client bindings.',
        object_syntax: 'When calling reducers, use object syntax: { field: value }'
      },

      table_rules: {
        indexes_in_options: 'Indexes are defined in table OPTIONS, not in columns.',
        auto_inc_placeholder: 'Auto-increment needs 0n placeholder.',
        primary_key_first: 'First field is primary key by convention.'
      },

      common_commands: {
        publish: `spacetime publish ${structure.dbName || '<db-name>'}`,
        start: `spacetime start ${structure.dbName || '<db-name>'}`,
        generate: 'spacetime generate <path-to-lib.rs>',
        logs: `spacetime logs ${structure.dbName || '<db-name>'}`
      },

      // Schema summary if available
      schema_summary: schema ? SchemaExtractor.getSummary(schema) : null,

      // Warnings
      warnings: [] as string[]
    };

    // Add warnings
    if (!structure.bindingsPath) {
      context.warnings.push('Bindings not found - run `spacetime generate`');
    }

    if (!structure.dbName) {
      context.warnings.push('Database name not detected - set STDB_DB_NAME');
    }

    return successResponse(context, Date.now() - startTime);
  } catch (err: any) {
    return errorResponse(
      'AGENT_CONTEXT_ERROR',
      err.message || 'Failed to generate agent context',
      null,
      [],
      Date.now() - startTime
    );
  }
}
