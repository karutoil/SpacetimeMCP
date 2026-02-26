/**
 * SpacetimeDB CLI Operator Tools
 */

import { runCommand, commandExists, getCommandVersion } from '../lib/command-runner.js';
import { tailLogs } from '../lib/log-follower.js';
import { loadConfig } from '../lib/config.js';
import { successResponse, errorResponse, ToolResponse } from '../lib/safe-json.js';

const config = loadConfig();

/**
 * Check CLI status
 */
export async function stdb_cli_status(): Promise<ToolResponse> {
  const startTime = Date.now();

  try {
    const hasCli = await commandExists('spacetime');
    let version: string | null = null;
    let modules: string[] = [];

    if (hasCli) {
      version = await getCommandVersion('spacetime', ['--version']);

      // Try to list known modules
      const result = await runCommand('spacetime', ['list'], { timeout: 10000 });
      if (result.exitCode === 0) {
        modules = result.stdout
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('='));
      }
    }

    return successResponse({
      cli_installed: hasCli,
      version,
      modules,
      project_root: config.projectRoot
    }, Date.now() - startTime);
  } catch (err: any) {
    return errorResponse(
      'STATUS_ERROR',
      err.message || 'Failed to get CLI status',
      null,
      [],
      Date.now() - startTime
    );
  }
}

/**
 * Start SpacetimeDB server
 */
export async function stdb_cli_start(dbName?: string): Promise<ToolResponse> {
  const startTime = Date.now();

  const name = dbName || config.dbName;

  if (!name) {
    return errorResponse(
      'MISSING_DB_NAME',
      'Database name is required. Pass as argument or set STDB_DB_NAME.',
      { provided: dbName, config: config.dbName },
      [],
      Date.now() - startTime
    );
  }

  if (!config.allowWrite) {
    return errorResponse(
      'PERMISSION_DENIED',
      'Write operations require STDB_MCP_ALLOW_WRITE=1',
      { env: 'STDB_MCP_ALLOW_WRITE' },
      [],
      Date.now() - startTime
    );
  }

  try {
    const result = await runCommand('spacetime', ['start', name], {
      cwd: config.projectRoot,
      timeout: 60000
    });

    if (result.timedOut) {
      // Server started but didn't exit (expected)
      return successResponse({
        started: true,
        message: `Server started for database: ${name}`,
        note: 'Server runs in foreground'
      }, Date.now() - startTime);
    }

    if (result.exitCode === 0) {
      return successResponse({
        started: true,
        output: result.stdout
      }, Date.now() - startTime);
    }

    return errorResponse(
      'START_FAILED',
      'Failed to start server',
      { stdout: result.stdout, stderr: result.stderr },
      [],
      Date.now() - startTime
    );
  } catch (err: any) {
    return errorResponse(
      'START_ERROR',
      err.message || 'Error starting server',
      null,
      [],
      Date.now() - startTime
    );
  }
}

/**
 * Publish module
 */
export async function stdb_cli_publish(modulePath?: string): Promise<ToolResponse> {
  const startTime = Date.now();

  if (!config.allowWrite) {
    return errorResponse(
      'PERMISSION_DENIED',
      'Write operations require STDB_MCP_ALLOW_WRITE=1',
      { env: 'STDB_MCP_ALLOW_WRITE' },
      [],
      Date.now() - startTime
    );
  }

  const path = modulePath || config.modulePath;
  const name = config.dbName;

  if (!name) {
    return errorResponse(
      'MISSING_DB_NAME',
      'Database name required. Set STDB_DB_NAME or --db-name',
      null,
      [],
      Date.now() - startTime
    );
  }

  try {
    const args = path
      ? ['publish', '--path', path, name]
      : ['publish', name];

    const result = await runCommand('spacetime', args, {
      cwd: config.projectRoot,
      timeout: 300000, // 5 minutes
      maxOutput: 2000000
    });

    if (result.exitCode === 0) {
      return successResponse({
        published: true,
        db_name: name,
        output: result.stdout
      }, Date.now() - startTime);
    }

    return errorResponse(
      'PUBLISH_FAILED',
      'Failed to publish module',
      { stdout: result.stdout, stderr: result.stderr },
      ['stdb.cli.status', 'dev.cargo.check'],
      Date.now() - startTime
    );
  } catch (err: any) {
    return errorResponse(
      'PUBLISH_ERROR',
      err.message || 'Error publishing module',
      null,
      [],
      Date.now() - startTime
    );
  }
}

/**
 * Generate bindings
 */
export async function stdb_cli_generate_bindings(modulePath?: string): Promise<ToolResponse> {
  const startTime = Date.now();

  if (!config.allowWrite) {
    return errorResponse(
      'PERMISSION_DENIED',
      'Write operations require STDB_MCP_ALLOW_WRITE=1',
      null,
      [],
      Date.now() - startTime
    );
  }

  const path = modulePath || config.modulePath;

  if (!path) {
    return errorResponse(
      'MISSING_MODULE_PATH',
      'Module path required. Set STDB_MODULE_PATH or --module-path',
      null,
      ['workspace.detect_module_path'],
      Date.now() - startTime
    );
  }

  try {
    const result = await runCommand('spacetime', ['generate', path], {
      cwd: config.projectRoot,
      timeout: 120000
    });

    if (result.exitCode === 0) {
      return successResponse({
        generated: true,
        output: result.stdout
      }, Date.now() - startTime);
    }

    return errorResponse(
      'GENERATE_FAILED',
      'Failed to generate bindings',
      { stdout: result.stdout, stderr: result.stderr },
      ['dev.cargo.check'],
      Date.now() - startTime
    );
  } catch (err: any) {
    return errorResponse(
      'GENERATE_ERROR',
      err.message || 'Error generating bindings',
      null,
      [],
      Date.now() - startTime
    );
  }
}

/**
 * Tail logs
 */
export async function stdb_cli_logs_tail(
  dbName?: string,
  lines: number = 100
): Promise<ToolResponse> {
  const startTime = Date.now();

  const name = dbName || config.dbName;

  if (!name) {
    return errorResponse(
      'MISSING_DB_NAME',
      'Database name required',
      null,
      [],
      Date.now() - startTime
    );
  }

  try {
    const entries = await tailLogs(name, lines, { cwd: config.projectRoot });

    return successResponse({
      db_name: name,
      entries,
      count: entries.length
    }, Date.now() - startTime);
  } catch (err: any) {
    return errorResponse(
      'LOGS_ERROR',
      err.message || 'Failed to tail logs',
      null,
      [],
      Date.now() - startTime
    );
  }
}

/**
 * Follow logs (returns start function - actual streaming done by client)
 */
export async function stdb_cli_logs_follow(
  dbName?: string
): Promise<ToolResponse> {
  const startTime = Date.now();

  const name = dbName || config.dbName;

  if (!name) {
    return errorResponse(
      'MISSING_DB_NAME',
      'Database name required',
      null,
      [],
      Date.now() - startTime
    );
  }

  return successResponse({
    command: `spacetime logs ${name} --follow`,
    note: 'Run this command in a terminal to stream logs',
    db_name: name
  }, Date.now() - startTime);
}
