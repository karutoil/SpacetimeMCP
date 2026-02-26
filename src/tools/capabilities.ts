/**
 * Capability Detection Tool
 */

import * as fs from 'fs';
import { runCommand, commandExists } from '../lib/command-runner.js';
import { loadConfig, detectProjectStructure } from '../lib/config.js';
import { successResponse, errorResponse, ToolResponse } from '../lib/safe-json.js';

const config = loadConfig();

/**
 * Detect runtime capabilities
 */
export async function stdb_capabilities(): Promise<ToolResponse> {
  const startTime = Date.now();

  try {
    const projectRoot = config.projectRoot;
    const structure = await detectProjectStructure(projectRoot);

    // Check if reducer calling is possible
    const canCallReducers = await checkReducerCapability(structure, config);
    const canRunServer = await checkServerCapability(config);
    const hasBindings = structure.bindingsPath !== null && fs.existsSync(structure.bindingsPath || '');

    const capabilities = {
      reducer_invocation: {
        possible: canCallReducers,
        reason: canCallReducers ? null : getReducerUnavailableReason(structure, config),
        requirements: [
          hasBindings ? 'Bindings available' : 'Run `spacetime generate`',
          canRunServer ? 'Server available' : 'Run `spacetime start`',
          config.uri ? 'URI configured' : 'Configure STDB_URI'
        ].filter(Boolean)
      },

      cli_tools: {
        spacetime_installed: await commandExists('spacetime'),
        cargo_installed: await commandExists('cargo')
      },

      project: {
        module_path: structure.modulePath,
        bindings_path: structure.bindingsPath,
        db_name: structure.dbName
      }
    };

    return successResponse(capabilities, Date.now() - startTime);
  } catch (err: any) {
    return errorResponse(
      'CAPABILITIES_ERROR',
      err.message || 'Failed to detect capabilities',
      null,
      [],
      Date.now() - startTime
    );
  }
}

/**
 * Check if reducers can be called
 */
async function checkReducerCapability(
  structure: { bindingsPath: string | null; dbName: string | null },
  config: any
): Promise<boolean> {
  // Need bindings
  if (!structure.bindingsPath) {
    return false;
  }

  // Need URI or running server
  if (!config.uri && !structure.dbName) {
    return false;
  }

  return true;
}

/**
 * Check if server can be started
 */
async function checkServerCapability(config: any): Promise<boolean> {
  try {
    const result = await runCommand('spacetime', ['list'], {
      timeout: 10000
    });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Get reason why reducer invocation is unavailable
 */
function getReducerUnavailableReason(
  structure: { bindingsPath: string | null; dbName: string | null },
  config: any
): string {
  if (!structure.bindingsPath) {
    return 'Bindings not generated. Run `spacetime generate <module-path>`.';
  }

  if (!structure.dbName && !config.uri) {
    return 'No database name or URI configured. Set STDB_DB_NAME or STDB_URI.';
  }

  return 'Unknown - check configuration';
}
