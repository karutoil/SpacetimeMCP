/**
 * SpacetimeDB Client Tools (Optional Runtime)
 * These require explicit permission and safety checks
 */

import { loadConfig } from '../lib/config.js';
import { successResponse, errorResponse, ToolResponse } from '../lib/safe-json.js';

const config = loadConfig();

/**
 * Connect to SpacetimeDB (returns connection info, doesn't actually connect)
 */
export async function stdb_client_connect(uri?: string): Promise<ToolResponse> {
  const startTime = Date.now();

  // Check permissions
  if (!config.allowWrite) {
    return errorResponse(
      'PERMISSION_DENIED',
      'Client operations require STDB_MCP_ALLOW_WRITE=1',
      null,
      [],
      Date.now() - startTime
    );
  }

  const targetUri = uri || config.uri;

  if (!targetUri) {
    return errorResponse(
      'MISSING_URI',
      'URI required. Pass as argument or set STDB_URI.',
      null,
      [],
      Date.now() - startTime
    );
  }

  // Note: Actual connection would require the generated bindings
  // This returns guidance for manual connection
  return successResponse({
    uri: targetUri,
    db_name: config.dbName,
    note: 'Use generated DbConnection to connect',
    example: `
import { DbConnection } from './module_bindings';

const connection = await DbConnection.connect(
  "${targetUri}",
  "${config.dbName || '<db-name>'}",
  null  // token or identity
);
    `.trim()
  }, Date.now() - startTime);
}

/**
 * Subscribe to data (returns subscription guidance)
 */
export async function stdb_client_subscribe(subscription: string): Promise<ToolResponse> {
  const startTime = Date.now();

  if (!config.allowWrite) {
    return errorResponse(
      'PERMISSION_DENIED',
      'Client operations require STDB_MCP_ALLOW_WRITE=1',
      null,
      [],
      Date.now() - startTime
    );
  }

  if (!subscription || subscription.length < 5) {
    return errorResponse(
      'INVALID_SUBSCRIPTION',
      'Valid SQL subscription required',
      null,
      [],
      Date.now() - startTime
    );
  }

  return successResponse({
    subscription,
    note: 'Use connection.subscribe() with generated bindings',
    example: `
await connection.subscribe([
  "SELECT * FROM Player WHERE id = $1"
]);

// Listen for updates
connection.on("Player", (event) => {
  console.log(event);
});
    `.trim()
  }, Date.now() - startTime);
}

/**
 * Call a reducer (returns guidance)
 */
export async function stdb_client_reducer_call(
  params: { reducerName: string; args: Record<string, any> }
): Promise<ToolResponse> {
  const { reducerName, args } = params;
  const startTime = Date.now();

  if (!config.allowWrite) {
    return errorResponse(
      'PERMISSION_DENIED',
      'Reducer invocation requires STDB_MCP_ALLOW_WRITE=1',
      null,
      [],
      Date.now() - startTime
    );
  }

  if (!reducerName) {
    return errorResponse(
      'MISSING_REDUCER',
      'Reducer name required',
      null,
      ['stdb_project_describe'],
      Date.now() - startTime
    );
  }

  // Validate BigInt in arguments
  const bigIntArgs = validateBigIntArgs(args);

  return successResponse({
    reducer: reducerName,
    args: bigIntArgs,
    note: 'Use generated reducer method on connection',
    example: `
await connection.${reducerName}(${formatArgsForExample(bigIntArgs)});
    `.trim(),
    warnings: [
      'Reducers do NOT return data',
      'Use subscriptions to read data after reducer completes',
      'Use BigInt for ID fields (e.g., 0n for auto-increment)'
    ]
  }, Date.now() - startTime);
}

/**
 * Validate BigInt arguments
 */
function validateBigIntArgs(args: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(args)) {
    if (typeof value === 'string' && value.endsWith('n')) {
      result[key] = `BigInt("${value.slice(0, -1)}")`;
    } else if (typeof value === 'number') {
      // Keep numbers as-is (likely not IDs)
      result[key] = value;
    } else {
      result[key] = JSON.stringify(value);
    }
  }

  return result;
}

/**
 * Format args for example display
 */
function formatArgsForExample(args: Record<string, any>): string {
  const parts = Object.entries(args).map(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('BigInt')) {
      return `${key}: ${value}`;
    }
    return `${key}: ${value}`;
  });

  return parts.join(', ');
}
